import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'

import { RecipesRepository } from '../repositories/recipes-repository'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { TagsRepository } from '../repositories/tags-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

export interface EditRecipeUseCaseRequest {
  recipeId: string
  authorId: string
  name?: string
  description?: string
  instructions?: string
  prepTimeInMinutes?: number
  cookTimeInMinutes?: number
  servings?: number
  difficultyLevel?: DifficultyLevel
  tags: string[]
  recipeIngredients: Array<{
    name: string
    amount: number
    unit: string
  }>
}

type EditRecipeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class EditRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private ingredientsRepository: IngredientsRepository,
    private tagsRepository: TagsRepository,
    private recipeIngredientsRepository: RecipeIngredientsRepository,
  ) {}

  async execute({
    recipeId,
    authorId,
    name,
    description,
    instructions,
    prepTimeInMinutes,
    cookTimeInMinutes,
    servings,
    difficultyLevel,
    tags,
    recipeIngredients,
  }: EditRecipeUseCaseRequest): Promise<EditRecipeUseCaseResponse> {
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    if (authorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    const tagsIds = await this.resolveTagsIds(tags)

    const recipeIngredientEntities = await this.resolveRecipeIngredients(
      recipe.id,
      recipeIngredients,
    )

    recipe.name = name ?? recipe.name
    recipe.description = description ?? recipe.description
    recipe.instructions = instructions ?? recipe.instructions
    recipe.prepTimeInMinutes = prepTimeInMinutes ?? recipe.prepTimeInMinutes
    recipe.cookTimeInMinutes = cookTimeInMinutes ?? recipe.cookTimeInMinutes
    recipe.servings = servings ?? recipe.servings
    recipe.difficultyLevel = difficultyLevel ?? recipe.difficultyLevel
    recipe.tagsIds = tagsIds
    recipe.recipeIngredientsIds = recipeIngredientEntities.map((ri) => ri.id)

    await this.recipesRepository.save(recipe)

    for (const recipeIngredient of recipeIngredientEntities) {
      const recipeIngredientAlreadyExists =
        await this.recipeIngredientsRepository.findById(
          recipeIngredient.id.toString(),
        )
      if (!recipeIngredientAlreadyExists) {
        await this.recipeIngredientsRepository.create(recipeIngredient)
      }
    }

    return right({ recipe })
  }

  private async resolveTagsIds(tags: string[]): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags) {
      const normalizedName = NormalizedName.createFromText(tag)

      let tagEntity =
        await this.tagsRepository.findByNormalizedName(normalizedName)

      if (!tagEntity) {
        tagEntity = Tag.create({ name: tag })
        await this.tagsRepository.create(tagEntity)
      }

      tagsIds.push(tagEntity.id)
    }

    return tagsIds
  }

  private async resolveRecipeIngredients(
    recipeId: UniqueEntityID,
    recipeIngredients: Array<{
      name: string
      amount: number
      unit: string
    }>,
  ): Promise<RecipeIngredient[]> {
    const recipeIngredientEntities: RecipeIngredient[] = []

    for (const input of recipeIngredients) {
      const normalizedName = NormalizedName.createFromText(input.name)

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(normalizedName)

      if (!ingredient) {
        ingredient = Ingredient.create({ name: input.name })
        await this.ingredientsRepository.create(ingredient)
      }

      const recipeIngredient = RecipeIngredient.create({
        recipeId,
        ingredientId: ingredient.id,
        amount: input.amount,
        unit: input.unit,
      })

      recipeIngredientEntities.push(recipeIngredient)
    }

    return recipeIngredientEntities
  }
}

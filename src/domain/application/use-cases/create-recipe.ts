import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'

import { RecipesRepository } from '../repositories/recipes-repository'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { TagsRepository } from '../repositories/tags-repository'

export interface CreateRecipeUseCaseRequest {
  authorId: string
  name: string
  description: string
  instructions: string
  prepTimeInMinutes: number
  cookTimeInMinutes: number
  servings: number
  difficultyLevel: DifficultyLevel
  tags?: string[]
  recipeIngredients: Array<{
    name: string
    amount: number
    unit: string
  }>
}

type CreateRecipeUseCaseResponse = Either<
  null,
  {
    recipe: Recipe
  }
>

@Injectable()
export class CreateRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private ingredientsRepository: IngredientsRepository,
    private tagsRepository: TagsRepository,
  ) {}

  async execute({
    authorId,
    name,
    description,
    instructions,
    prepTimeInMinutes,
    cookTimeInMinutes,
    servings,
    difficultyLevel,
    tags = [],
    recipeIngredients = [],
  }: CreateRecipeUseCaseRequest): Promise<CreateRecipeUseCaseResponse> {
    const recipeId = new UniqueEntityID()

    const tagsIds = await this.resolveTagsIds(tags)

    const recipeIngredientEntities = await this.resolveRecipeIngredients(
      recipeId,
      recipeIngredients,
    )

    const recipe = Recipe.create(
      {
        authorId: new UniqueEntityID(authorId),
        name,
        description,
        instructions,
        prepTimeInMinutes,
        cookTimeInMinutes,
        servings,
        difficultyLevel,
        tagsIds,
        ingredients: new RecipeIngredientList(recipeIngredientEntities),
      },
      recipeId,
    )

    await this.recipesRepository.create(recipe)

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

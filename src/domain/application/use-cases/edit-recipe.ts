import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { normalizeText } from '@/domain/utils/normalize-text'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'

import { RecipesRepository } from '../repositories/recipes-repository'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { TagsRepository } from '../repositories/tags-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

interface CreateRecipeUseCaseRequest {
  recipeId: string
  authorId: string
  name?: string // ??? como fazer com os dados opcionais? Eles são opcionais mesmo ou no front já vai validar que se não foi entregue o dado novo, enviará o dado antigo?
  description?: string
  instructions?: string
  prepTimeInMinutes?: number
  cookTimeInMinutes?: number
  servings?: number
  difficultyLevel?: DifficultyLevel
  tags?: string[]
  recipeIngredients?: Array<{
    recipeIngredientId?: string // ??? esse campo é necessário aqui?
    name: string
    amount: number
    unit: string
  }>
}

type CreateRecipeUseCaseResponse = Either<
  ResourceNotFoundError,
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
    private recipeIngredientsRepository: RecipeIngredientsRepository,
  ) {}

  async execute({
    recipeId,
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
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
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
    // ??? como lidar com os recipeIngredients aqui? substituir todos os antigos pelos novos?

    await this.recipesRepository.save(recipe)

    for (const recipeIngredient of recipeIngredientEntities) {
      const recipeIngredientAlreadyExists =
        await this.recipeIngredientsRepository.findById(
          recipeIngredient.id.toString(),
        )
      if (!recipeIngredientAlreadyExists) {
        await this.recipeIngredientsRepository.create(recipeIngredient)
      }
      // ??? facço aqui a validação para ver se já existe esse recipeIngredient ou eu vou repor a lista inteira? e se isso, o recipeIngredient que não fizer mais parte deveria ser deletado do banco de dados...
    }

    return right({ recipe })
  }

  private async resolveTagsIds(tags: string[]): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags) {
      const normalizedName = normalizeText(tag)

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
      const normalizedName = normalizeText(input.name)

      // ??? aqui precisa de uma validação para ver se já existe esse recipeIngredient ou eu vou repor a lista inteira? e se isso, o recipeIngredient que não fizer mais parte deveria ser deletado do banco de dados...

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

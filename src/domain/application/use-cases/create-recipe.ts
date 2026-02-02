import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { normalizeText } from '@/domain/utils/normalize-text'
import { TagsRepository } from '../repositories/tags-repository'
import { Tag } from '@/domain/enterprise/entities/tag'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { RecipesRepository } from '../repositories/recipes-repository'

interface CreateRecipeUseCaseRequest {
  authorId: string
  title: string
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
    private recipeIngredientsRepository: RecipeIngredientsRepository,
  ) {}

  async execute({
    authorId,
    title,
    description,
    instructions,
    prepTimeInMinutes,
    cookTimeInMinutes,
    servings,
    difficultyLevel,
    tags,
    recipeIngredients,
  }: CreateRecipeUseCaseRequest): Promise<CreateRecipeUseCaseResponse> {
    const recipe = Recipe.create({
      authorId: new UniqueEntityID(authorId),
      title,
      description,
      instructions,
      prepTimeInMinutes,
      cookTimeInMinutes,
      servings,
      difficultyLevel,
    })

    const tagsIds = await this.resolveTagsIds(tags)
    const recipeIngredientsIds = await this.resolveRecipeIngredientsIds(
      recipe.id,
      recipeIngredients,
    )

    recipe.tagsIds = tagsIds
    recipe.recipeIngredientsIds = recipeIngredientsIds

    await this.recipesRepository.create(recipe)

    return right({ recipe })
  }

  private async resolveTagsIds(tags: string[] = []): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags ?? []) {
      const normalizedTag = normalizeText(tag)

      let tagEntity =
        await this.tagsRepository.findByNormalizedName(normalizedTag)

      if (!tagEntity) {
        tagEntity = Tag.create({
          name: tag,
        })

        await this.tagsRepository.create(tagEntity)
      }

      tagsIds.push(tagEntity.id)
    }

    return tagsIds
  }

  private async resolveRecipeIngredientsIds(
    recipeId: UniqueEntityID,
    recipeIngredients: Array<{
      name: string
      amount: number
      unit: string
    }> = [],
  ): Promise<UniqueEntityID[]> {
    const recipeIngredientsIds: UniqueEntityID[] = []

    for (const recipeIngredient of recipeIngredients ?? []) {
      const normalizedIngredient = normalizeText(recipeIngredient.name)

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(
          normalizedIngredient,
        )

      if (!ingredient) {
        ingredient = Ingredient.create({
          name: recipeIngredient.name,
        })

        await this.ingredientsRepository.create(ingredient)
      }

      const recipeIngredientEntity = RecipeIngredient.create({
        recipeId,
        ingredientId: ingredient.id,
        amount: recipeIngredient.amount,
        unit: recipeIngredient.unit,
      })

      await this.recipeIngredientsRepository.create(recipeIngredientEntity)

      recipeIngredientsIds.push(recipeIngredientEntity.id)
    }

    return recipeIngredientsIds
  }
}

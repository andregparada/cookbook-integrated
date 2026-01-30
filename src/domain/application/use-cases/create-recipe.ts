import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { normalizeText } from '@/domain/utils/normalize-text'

interface RegisterRecipeUseCaseRequest {
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
    ingredient: string
    amount: number
    unit: string
  }>
}

type RegisterRecipeUseCaseResponse = Either<
  null,
  {
    recipe: Recipe
  }
>

@Injectable()
export class RegisterRecipeUseCase {
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
  }: RegisterRecipeUseCaseRequest): Promise<RegisterRecipeUseCaseResponse> {
    const tagsIds = await this.resolveTagsIds(tags)
    const recipeIngredientsIds =
      await this.resolveRecipeIngredientsIds(recipeIngredients)

    const recipe = Recipe.create({
      authorId: new UniqueEntityID(authorId),
      title,
      description,
      instructions,
      prepTimeInMinutes,
      cookTimeInMinutes,
      servings,
      difficultyLevel,
      tagsIds,
      recipeIngredientsIds,
    })

    await this.recipesRepository.create(recipe)

    return right({ recipe })
  }

  // ======================
  // Métodos privados
  // ======================

  private async resolveTagsIds(tags?: string[]): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags ?? []) {
      const normalizedTag = normalizeText(tag)

      let tagEntity =
        await this.tagsRepository.findByNormalizedName(normalizedTag)

      if (!tagEntity) {
        tagEntity = await this.tagsRepository.create({ name: tag })
      }

      tagsIds.push(tagEntity.id)
    }

    return tagsIds
  }

  private async resolveRecipeIngredientsIds(
    recipeIngredients?: Array<{
      ingredient: string
      amount: number
      unit: string
    }>,
  ): Promise<UniqueEntityID[]> {
    const recipeIngredientsIds: UniqueEntityID[] = []

    for (const recipeIngredient of recipeIngredients ?? []) {
      const normalizedIngredient = normalizeText(recipeIngredient.ingredient)

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(
          normalizedIngredient,
        )

      if (!ingredient) {
        ingredient = await this.ingredientsRepository.create({
          name: recipeIngredient.ingredient,
        })
      }

      const recipeIngredientEntity =
        await this.recipeIngredientsRepository.create({
          ingredientId: ingredient.id,
          amount: recipeIngredient.amount,
          unit: recipeIngredient.unit,
        })

      recipeIngredientsIds.push(recipeIngredientEntity.id)
    }

    return recipeIngredientsIds
  }
}

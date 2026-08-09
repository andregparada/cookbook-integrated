import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'

import { RecipesRepository } from '../repositories/recipes-repository'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'

export interface CreateRecipeUseCaseRequest {
  authorId: string
  name: string
  description: string | null
  instructions: string
  prepTimeInMinutes?: number | null
  cookTimeInMinutes?: number | null
  servings?: number | null
  difficultyLevel: DifficultyLevel
  tags?: string[]
  recipeIngredients?: Array<{
    name: string
    amount: number
    unit: string
  }>
}

type CreateRecipeUseCaseResponse = Either<
  InvalidRecipeTimingOrServingsError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class CreateRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private catalogResolver: RecipeCatalogResolver,
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

    const tagsIds = await this.catalogResolver.resolveTagsIds(tags)

    const recipeIngredientEntities =
      await this.catalogResolver.resolveRecipeIngredients(
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

    const timingIssues = recipe.getTimingAndServingsIssues()

    if (timingIssues.length > 0) {
      return left(new InvalidRecipeTimingOrServingsError(timingIssues))
    }

    await this.recipesRepository.create(recipe)

    return right({ recipe })
  }
}

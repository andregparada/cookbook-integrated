import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { RecipeInstructions } from '@/domain/enterprise/entities/value-objects/recipe-instructions'
import { RecipeTagNames } from '@/domain/enterprise/entities/value-objects/recipe-tag-names'

import { RecipesRepository } from '../repositories/recipes-repository'
import {
  RecipeCatalogResolver,
  RecipeIngredientInput,
} from '../services/recipe-catalog-resolver'

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
  recipeIngredients?: RecipeIngredientInput[]
}

type CreateRecipeUseCaseResponse = Either<
  | InvalidRecipeInstructionsError
  | InvalidRecipeTagsError
  | InvalidRecipeTimingOrServingsError
  | InvalidRecipeIngredientMeasurementError,
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
    const instructionsResult = RecipeInstructions.create(instructions)

    if (instructionsResult.isLeft()) {
      return left(instructionsResult.value)
    }

    const tagNamesResult = RecipeTagNames.create(tags)

    if (tagNamesResult.isLeft()) {
      return left(tagNamesResult.value)
    }

    const recipeId = new UniqueEntityID()

    const tagsIds = await this.catalogResolver.resolveTagsIds(
      tagNamesResult.value,
    )

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
        instructions: instructionsResult.value.value,
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

    const measurementIssues = recipe.getIngredientMeasurementIssues()

    if (measurementIssues.length > 0) {
      return left(
        new InvalidRecipeIngredientMeasurementError(measurementIssues),
      )
    }

    await this.recipesRepository.create(recipe)

    return right({ recipe })
  }
}

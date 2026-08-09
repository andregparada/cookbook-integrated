import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'

import {
  DifficultyLevel,
  Recipe,
  RecipeStatus,
} from '../../enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'

import { RecipesRepository } from '../repositories/recipes-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
import {
  RecipeCatalogResolver,
  RecipeIngredientInput,
} from '../services/recipe-catalog-resolver'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { UnknownRecipeIngredientError } from '@/domain/enterprise/errors/unknown-recipe-ingredient-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { RecipeInstructions } from '@/domain/enterprise/entities/value-objects/recipe-instructions'

export interface EditRecipeUseCaseRequest {
  recipeId: string
  actorId: string
  name?: string
  description?: string | null
  instructions?: string
  prepTimeInMinutes?: number | null
  cookTimeInMinutes?: number | null
  servings?: number | null
  difficultyLevel?: DifficultyLevel
  tags: string[]
  recipeIngredients: RecipeIngredientInput[]
}

type EditRecipeUseCaseResponse = Either<
  | ResourceNotFoundError
  | NotAllowedError
  | RecipeNotPublishableError
  | InvalidRecipeInstructionsError
  | InvalidRecipeTimingOrServingsError
  | InvalidRecipeIngredientMeasurementError
  | UnknownRecipeIngredientError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class EditRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private recipeIngredientsRepository: RecipeIngredientsRepository,
    private catalogResolver: RecipeCatalogResolver,
  ) {}

  async execute({
    recipeId,
    actorId,
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

    if (actorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    const tagsIds = await this.catalogResolver.resolveTagsIds(tags)

    const currentRecipeIngredients =
      await this.recipeIngredientsRepository.findManyByRecipeId(recipeId)

    const currentIngredientIds = new Set(
      currentRecipeIngredients.map((item) => item.id.toString()),
    )

    const unknownIngredientIssues = recipeIngredients.flatMap((input, index) =>
      input.id && !currentIngredientIds.has(input.id)
        ? [`recipeIngredients[${index}]`]
        : [],
    )

    if (unknownIngredientIssues.length > 0) {
      return left(new UnknownRecipeIngredientError(unknownIngredientIssues))
    }

    const recipeIngredientList = new RecipeIngredientList(
      currentRecipeIngredients,
    )

    const recipeIngredientEntities =
      await this.catalogResolver.resolveRecipeIngredients(
        recipe.id,
        recipeIngredients,
      )

    recipeIngredientList.update(recipeIngredientEntities)

    recipe.ingredients = recipeIngredientList
    recipe.name = name ?? recipe.name

    if (description !== undefined) {
      recipe.description = description
    }

    if (instructions !== undefined) {
      const instructionsResult = RecipeInstructions.create(instructions)

      if (instructionsResult.isLeft()) {
        return left(instructionsResult.value)
      }

      recipe.instructions = instructionsResult.value.value
    }

    if (prepTimeInMinutes !== undefined) {
      recipe.prepTimeInMinutes = prepTimeInMinutes
    }

    if (cookTimeInMinutes !== undefined) {
      recipe.cookTimeInMinutes = cookTimeInMinutes
    }

    if (servings !== undefined) {
      recipe.servings = servings
    }

    recipe.difficultyLevel = difficultyLevel ?? recipe.difficultyLevel
    recipe.tagsIds = tagsIds

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

    if (recipe.status === RecipeStatus.PUBLISHED) {
      const issues = recipe.getPublishabilityIssues()

      if (issues.length > 0) {
        return left(new RecipeNotPublishableError(issues))
      }
    }

    await this.recipesRepository.save(recipe)

    return right({ recipe })
  }
}

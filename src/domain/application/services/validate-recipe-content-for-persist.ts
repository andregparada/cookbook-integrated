import { Either, left, right } from '@/core/either'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'

type ValidateRecipeContentForPersistOptions = {
  checkPublishability?: boolean
}

type RecipeContentPersistError =
  | InvalidRecipeTimingOrServingsError
  | InvalidRecipeIngredientMeasurementError
  | RecipeNotPublishableError

export function validateRecipeContentForPersist(
  recipe: Recipe,
  options: ValidateRecipeContentForPersistOptions = {},
): Either<RecipeContentPersistError, void> {
  const { timing, measurement } = recipe.getContentConstraintIssues()

  if (timing.length > 0) {
    return left(new InvalidRecipeTimingOrServingsError(timing))
  }

  if (measurement.length > 0) {
    return left(new InvalidRecipeIngredientMeasurementError(measurement))
  }

  if (options.checkPublishability) {
    const publishabilityIssues = recipe.getPublishabilityIssues()

    if (publishabilityIssues.length > 0) {
      return left(new RecipeNotPublishableError(publishabilityIssues))
    }
  }

  return right(undefined)
}

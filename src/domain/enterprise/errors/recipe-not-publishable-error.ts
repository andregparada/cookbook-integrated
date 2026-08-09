import { UseCaseError } from '@/core/errors/use-case-error'

export class RecipeNotPublishableError extends Error implements UseCaseError {
  constructor(missingFields: string[]) {
    super(
      `Recipe cannot be published. Missing required fields: ${missingFields.join(', ')}.`,
    )
  }
}

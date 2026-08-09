import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidRecipeTagsError extends Error implements UseCaseError {
  constructor(issues: string[]) {
    super(`Invalid recipe tags. Issues: ${issues.join(', ')}.`)
  }
}

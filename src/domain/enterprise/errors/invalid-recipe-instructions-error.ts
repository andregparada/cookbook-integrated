import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidRecipeInstructionsError
  extends Error
  implements UseCaseError
{
  constructor(message: string) {
    super(message)
  }
}

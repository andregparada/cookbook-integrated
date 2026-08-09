import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidRecipeIngredientMeasurementError
  extends Error
  implements UseCaseError
{
  constructor(issues: string[]) {
    super(
      `Invalid recipe ingredient measurement. Issues: ${issues.join(', ')}.`,
    )
  }
}

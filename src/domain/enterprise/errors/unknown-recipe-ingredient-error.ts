import { UseCaseError } from '@/core/errors/use-case-error'

export class UnknownRecipeIngredientError
  extends Error
  implements UseCaseError
{
  constructor(issues: string[]) {
    super(`Unknown recipe ingredient. Issues: ${issues.join(', ')}.`)
  }
}

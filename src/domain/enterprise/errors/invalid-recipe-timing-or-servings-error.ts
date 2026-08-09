import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidRecipeTimingOrServingsError
  extends Error
  implements UseCaseError
{
  constructor(issues: string[]) {
    super(`Invalid recipe timing or servings. Issues: ${issues.join(', ')}.`)
  }
}

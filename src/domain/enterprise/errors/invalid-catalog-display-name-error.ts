import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidCatalogDisplayNameError
  extends Error
  implements UseCaseError
{
  public readonly issues: string[]

  constructor(issues: string[]) {
    super(`Invalid catalog display name. Issues: ${issues.join(', ')}.`)
    this.issues = issues
  }
}

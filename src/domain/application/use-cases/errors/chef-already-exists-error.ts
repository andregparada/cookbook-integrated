import { UseCaseError } from '@/core/errors/use-case-error'

export class ChefAlreadyExistsError extends Error implements UseCaseError {
  constructor(identifier: string) {
    super(`Chef ${identifier} already exists.`)
  }
}

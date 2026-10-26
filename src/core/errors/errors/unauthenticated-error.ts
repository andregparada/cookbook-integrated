import { UseCaseError } from '@/core/errors/use-case-error'

export class UnauthenticatedError extends Error implements UseCaseError {
  constructor() {
    super('Authentication required')
  }
}

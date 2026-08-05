import { Either, left, right } from '@/core/either'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'

export class UserName {
  static readonly MIN_LENGTH = 3
  static readonly MAX_LENGTH = 30
  static readonly FORMAT = /^[a-zA-Z0-9_-]+$/
  static readonly RESERVED_NAMES = new Set([
    'admin',
    'api',
    'recipes',
    'search',
    'accounts',
    'sessions',
    'user',
    'users',
    'chefs',
    'me',
  ])

  public readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  get comparisonKey() {
    return this.value.toLowerCase()
  }

  static create(value: string): Either<InvalidUserNameError, UserName> {
    if (value.length < UserName.MIN_LENGTH) {
      return left(
        new InvalidUserNameError(
          `User name must be at least ${UserName.MIN_LENGTH} characters.`,
        ),
      )
    }

    if (value.length > UserName.MAX_LENGTH) {
      return left(
        new InvalidUserNameError(
          `User name must be at most ${UserName.MAX_LENGTH} characters.`,
        ),
      )
    }

    if (!UserName.FORMAT.test(value)) {
      return left(
        new InvalidUserNameError(
          'User name must contain only alphanumeric characters, hyphens, and underscores.',
        ),
      )
    }

    if (UserName.RESERVED_NAMES.has(value.toLowerCase())) {
      return left(new InvalidUserNameError('User name is reserved.'))
    }

    return right(new UserName(value))
  }
}

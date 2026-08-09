import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ChefAlreadyExistsError } from '@/domain/application/use-cases/errors/chef-already-exists-error'
import { WrongCredentialsError } from '@/domain/application/use-cases/errors/wrong-credentials-error'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { UnknownRecipeIngredientError } from '@/domain/enterprise/errors/unknown-recipe-ingredient-error'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

export function mapDomainErrorToHttpException(error: unknown): HttpException {
  if (error instanceof ResourceNotFoundError) {
    return new NotFoundException(error.message)
  }

  if (error instanceof NotAllowedError) {
    return new ForbiddenException(error.message)
  }

  if (error instanceof WrongCredentialsError) {
    return new UnauthorizedException(error.message)
  }

  if (error instanceof ChefAlreadyExistsError) {
    return new ConflictException(error.message)
  }

  if (error instanceof InvalidUserNameError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof RecipeNotPublishableError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof InvalidRecipeInstructionsError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof InvalidRecipeTimingOrServingsError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof InvalidRecipeIngredientMeasurementError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof UnknownRecipeIngredientError) {
    return new BadRequestException(error.message)
  }

  if (error instanceof Error) {
    return new BadRequestException(error.message)
  }

  return new BadRequestException()
}

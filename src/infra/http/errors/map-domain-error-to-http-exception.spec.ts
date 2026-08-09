import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ChefAlreadyExistsError } from '@/domain/application/use-cases/errors/chef-already-exists-error'
import { WrongCredentialsError } from '@/domain/application/use-cases/errors/wrong-credentials-error'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UnknownRecipeIngredientError } from '@/domain/enterprise/errors/unknown-recipe-ingredient-error'
import { mapDomainErrorToHttpException } from './map-domain-error-to-http-exception'

describe('mapDomainErrorToHttpException', () => {
  it('should map ResourceNotFoundError to 404', () => {
    const error = mapDomainErrorToHttpException(new ResourceNotFoundError())

    expect(error).toBeInstanceOf(NotFoundException)
    expect(error.getStatus()).toBe(404)
  })

  it('should map NotAllowedError to 403', () => {
    const error = mapDomainErrorToHttpException(new NotAllowedError())

    expect(error).toBeInstanceOf(ForbiddenException)
    expect(error.getStatus()).toBe(403)
  })

  it('should map WrongCredentialsError to 401', () => {
    const error = mapDomainErrorToHttpException(new WrongCredentialsError())

    expect(error).toBeInstanceOf(UnauthorizedException)
    expect(error.getStatus()).toBe(401)
  })

  it('should map ChefAlreadyExistsError to 409', () => {
    const error = mapDomainErrorToHttpException(
      new ChefAlreadyExistsError('chef@example.com'),
    )

    expect(error).toBeInstanceOf(ConflictException)
    expect(error.getStatus()).toBe(409)
  })

  it('should map InvalidUserNameError to 400', () => {
    const error = mapDomainErrorToHttpException(
      new InvalidUserNameError('User name is reserved.'),
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })

  it('should map RecipeNotPublishableError to 400', () => {
    const error = mapDomainErrorToHttpException(
      new RecipeNotPublishableError(['name', 'ingredients']),
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })

  it('should map InvalidRecipeInstructionsError to 400', () => {
    const error = mapDomainErrorToHttpException(
      new InvalidRecipeInstructionsError(
        'Recipe instructions must be at most 10000 characters.',
      ),
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })

  it('should map UnknownRecipeIngredientError to 400', () => {
    const error = mapDomainErrorToHttpException(
      new UnknownRecipeIngredientError(['recipeIngredients[0]']),
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })

  it('should map generic Error to 400', () => {
    const error = mapDomainErrorToHttpException(
      new Error('Something went wrong'),
    )

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })

  it('should map unknown values to 400', () => {
    const error = mapDomainErrorToHttpException('unexpected')

    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.getStatus()).toBe(400)
  })
})

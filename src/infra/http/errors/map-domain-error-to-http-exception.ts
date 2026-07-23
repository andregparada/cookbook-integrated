import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ChefAlreadyExistsError } from '@/domain/application/use-cases/errors/chef-already-exists-error'
import { WrongCredentialsError } from '@/domain/application/use-cases/errors/wrong-credentials-error'
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

  if (error instanceof Error) {
    return new BadRequestException(error.message)
  }

  return new BadRequestException()
}

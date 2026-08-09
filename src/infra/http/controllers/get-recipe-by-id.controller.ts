import { GetRecipeByIdUseCase } from '@/domain/application/use-cases/get-recipe-by-id'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { Public } from '@/infra/auth/public'
import { Controller, Get, Param, Req } from '@nestjs/common'
import { RecipeDetailsPresenter } from '../presenters/recipe-details-presenter'
import type { Request } from 'express'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/recipes/:id')
export class GetRecipeByIdController {
  constructor(private getRecipeById: GetRecipeByIdUseCase) {}

  @Public()
  @Get()
  async handle(@Param('id') id: string, @Req() request: Request) {
    const user = request.user as UserPayload | undefined

    const result = await this.getRecipeById.execute({
      id,
      actorId: user?.sub,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }

    return { recipe: RecipeDetailsPresenter.toHTTP(result.value.recipe) }
  }
}

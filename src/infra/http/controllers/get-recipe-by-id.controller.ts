import { GetRecipeByIdUseCase } from '@/domain/application/use-cases/get-recipe-by-id'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { Controller, Get, Param } from '@nestjs/common'
import { RecipeDetailsPresenter } from '../presenters/receipe-details-presenter'

@Controller('/recipes/:id')
export class GetRecipeByIdController {
  constructor(private getRecipeById: GetRecipeByIdUseCase) {}

  @Get()
  async handle(@Param('id') id: string) {
    const result = await this.getRecipeById.execute({
      id,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }

    return { recipe: RecipeDetailsPresenter.toHTTP(result.value.recipe) }
  }
}

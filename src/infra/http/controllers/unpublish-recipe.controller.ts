import { Controller, HttpCode, Param, Post } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { UnpublishRecipeUseCase } from '@/domain/application/use-cases/unpublish-recipe'

@Controller('/recipes/:id')
export class UnpublishRecipeController {
  constructor(private unpublishRecipe: UnpublishRecipeUseCase) {}

  @Post('unpublish')
  @HttpCode(204)
  async handle(
    @Param('id') recipeId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.unpublishRecipe.execute({
      recipeId,
      actorId: user.sub,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }
  }
}

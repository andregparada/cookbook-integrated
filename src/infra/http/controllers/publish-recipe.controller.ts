import { Controller, HttpCode, Param, Post } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { PublishRecipeUseCase } from '@/domain/application/use-cases/publish-recipe'

@Controller('/recipes/:id')
export class PublishRecipeController {
  constructor(private publishRecipe: PublishRecipeUseCase) {}

  @Post('publish')
  @HttpCode(204)
  async handle(
    @Param('id') recipeId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.publishRecipe.execute({
      recipeId,
      actorId: user.sub,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }
  }
}

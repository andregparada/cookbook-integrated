import { Controller, Delete, HttpCode, Param } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DeleteRecipeUseCase } from '@/domain/application/use-cases/delete-recipe'

@Controller('/recipes/:id')
export class DeleteRecipeController {
  constructor(private deleteRecipe: DeleteRecipeUseCase) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Param('id') recipeId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.deleteRecipe.execute({
      recipeId,
      actorId: user.sub,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }
  }
}

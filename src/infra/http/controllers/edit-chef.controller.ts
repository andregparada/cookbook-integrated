import { Body, Controller, HttpCode, Put } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { EditChefUseCase } from '@/domain/application/use-cases/edit-chef'

const editChefBodySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userName: z.string().min(3).max(30).optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  avatarId: z.uuid().optional(),
  bio: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editChefBodySchema)

type EditChefBodySchema = z.infer<typeof editChefBodySchema>

@Controller('/user/me')
export class EditChefController {
  constructor(private editChef: EditChefUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditChefBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { firstName, lastName, userName, email, password, avatarId, bio } =
      body

    const userId = user.sub

    const result = await this.editChef.execute({
      actorId: userId,
      chefId: userId,
      firstName,
      lastName,
      userName,
      email,
      password,
      avatarId,
      bio,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }
  }
}

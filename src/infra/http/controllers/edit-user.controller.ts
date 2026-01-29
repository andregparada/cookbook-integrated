import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { EditChefUseCase } from '@/domain/application/use-cases/edit-chef'

const editUserBodySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userName: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  avatarId: z.uuid().optional(),
  bio: z.string().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editUserBodySchema)

type EditUserBodySchema = z.infer<typeof editUserBodySchema>

@Controller('/user/me')
export class EditUserController {
  constructor(private editUser: EditChefUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditUserBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { firstName, lastName, userName, email, password, avatarId, bio } =
      body

    const userId = user.sub

    const result = await this.editUser.execute({
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
      throw new BadRequestException()
    }
  }
}

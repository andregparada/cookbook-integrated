import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'
import { Public } from '@/infra/auth/public'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common'
import z from 'zod'

const createAccountBodySchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  userName: z.string(),
  email: z.email(),
  password: z.string(),
  avatarId: z.uuid().optional(),
  bio: z.string().optional(),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@Public()
export class CreateAccountController {
  constructor(private registerChef: RegisterChefUseCase) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { firstName, lastName, userName, email, password, avatarId, bio } =
      body

    const result = await this.registerChef.execute({
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

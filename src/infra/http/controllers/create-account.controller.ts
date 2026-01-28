import { ChefAlreadyExistsError } from '@/domain/application/use-cases/errors/chef-already-exists-error'
import { RegisterChefUseCase } from '@/domain/application/use-cases/register-chef'
import { Public } from '@/infra/auth/public'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common'
import z from 'zod'

const createAccountBodySchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  userName: z.string(),
  email: z.string().email(),
  password: z.string(),
  avatarId: z.string().optional(),
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
      const error = result.value

      switch (error.constructor) {
        case ChefAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}

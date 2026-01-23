import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { PrismaService } from '@/prisma/prisma.service'
import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common'
import z from 'zod'

const createAccountBodySchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  userName: z.string(),
  email: z.string().email(),
  password: z.string(),
  bio: z.string().optional(),
})

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createAccountBodySchema))
  async handle(@Body() body: CreateAccountBodySchema) {
    const { firstName, lastName, userName, email, password, bio } = body

    await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        userName,
        email,
        password,
        bio,
      },
    })
  }
}

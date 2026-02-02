import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { CreateRecipeUseCase } from '@/domain/application/use-cases/create-recipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const createRecipeBodySchema = z.object({
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  prepTimeInMinutes: z.number().int().nonnegative(),
  cookTimeInMinutes: z.number().int().nonnegative(),
  servings: z.number().int().nonnegative(),
  difficultyLevel: z.enum(DifficultyLevel),
  tags: z.array(z.string()).optional(),
  recipeIngredients: z.array(
    z.object({
      name: z.string(),
      amount: z.number().nonnegative(),
      unit: z.string(),
    }),
  ),
})

const bodyValidationPipe = new ZodValidationPipe(createRecipeBodySchema)

type CreateRecipeBodySchema = z.infer<typeof createRecipeBodySchema>

@Controller('/recipes')
export class CreateRecipeController {
  constructor(private createRecipe: CreateRecipeUseCase) {}

  @Post()
  async handle(
    @Body(bodyValidationPipe) body: CreateRecipeBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const {
      title,
      description,
      instructions,
      prepTimeInMinutes,
      cookTimeInMinutes,
      servings,
      difficultyLevel,
      tags,
      recipeIngredients,
    } = body
    const userId = user.sub

    const result = await this.createRecipe.execute({
      authorId: userId,
      title,
      description,
      instructions,
      prepTimeInMinutes,
      cookTimeInMinutes,
      servings,
      difficultyLevel,
      tags,
      recipeIngredients,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}

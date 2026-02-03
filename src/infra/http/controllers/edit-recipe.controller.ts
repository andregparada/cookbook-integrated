import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import { EditRecipeUseCase } from '@/domain/application/use-cases/edit-recipe'

const editRecipeBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTimeInMinutes: z.number().optional(),
  cookTimeInMinutes: z.number().optional(),
  servings: z.number().optional(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
  tags: z.array(z.string()).optional(),
  recipeIngredients: z
    .array(
      z.object({
        recipeIngredientId: z.string().uuid().optional(),
        name: z.string(),
        amount: z.number(),
        unit: z.string(),
      }),
    )
    .optional(),
})

const bodyValidationPipe = new ZodValidationPipe(editRecipeBodySchema)

type EditRecipeBodySchema = z.infer<typeof editRecipeBodySchema>

@Controller('/recipes/:id')
export class EditRecipeController {
  constructor(private editRecipe: EditRecipeUseCase) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Body(bodyValidationPipe) body: EditRecipeBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') recipeId: string,
  ) {
    const {
      name,
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

    const result = await this.editRecipe.execute({
      authorId: userId,
      recipeId,
      name,
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

import { Body, Controller, HttpCode, Param, Put } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import z from 'zod'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { EditRecipeUseCase } from '@/domain/application/use-cases/edit-recipe'

const editRecipeBodySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullish(),
  instructions: z.string().optional(),
  prepTimeInMinutes: z.number().int().nonnegative().nullish(),
  cookTimeInMinutes: z.number().int().nonnegative().nullish(),
  servings: z.number().int().min(1).nullish(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).optional(),
  tags: z.array(z.string()).optional(),
  recipeIngredients: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
      amount: z.number().positive().nullable(),
      unit: z.nativeEnum(MeasurementUnit),
      note: z.string().trim().max(200).nullish(),
    }),
  ),
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
      actorId: userId,
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
      throw mapDomainErrorToHttpException(result.value)
    }
  }
}

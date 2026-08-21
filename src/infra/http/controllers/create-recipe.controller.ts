import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { Body, Controller, Post } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CreateRecipeUseCase } from '@/domain/application/use-cases/create-recipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'

const createRecipeBodySchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  instructions: z.string(),
  prepTimeInMinutes: z.number().int().nonnegative().nullish(),
  cookTimeInMinutes: z.number().int().nonnegative().nullish(),
  servings: z.number().int().min(1).nullish(),
  difficultyLevel: z.nativeEnum(DifficultyLevel).nullish(),
  tags: z.array(z.string()).optional(),
  recipeIngredients: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().positive().nullable(),
        // TODO: ver nativeEnum deprecated
        unit: z.nativeEnum(MeasurementUnit),
        note: z.string().trim().max(200).nullish(),
      }),
    )
    .optional(),
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

    const result = await this.createRecipe.execute({
      authorId: userId,
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

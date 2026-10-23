import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import { Body, Controller, Post } from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { CreateRecipeUseCase } from '@/domain/application/use-cases/create-recipe'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import {
  createRecipeIngredientBodySchema,
  recipeDifficultyLevelSchema,
  recipeTagsSchema,
} from '@/infra/http/schemas/recipe-request.schemas'

const createRecipeBodySchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  instructions: z.string(),
  prepTimeInMinutes: z.number().int().nonnegative().nullish(),
  cookTimeInMinutes: z.number().int().nonnegative().nullish(),
  servings: z.number().int().min(1).nullish(),
  difficultyLevel: recipeDifficultyLevelSchema,
  tags: recipeTagsSchema,
  recipeIngredients: z.array(createRecipeIngredientBodySchema).optional(),
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

import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipe'
import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import { mapDomainErrorToHttpException } from '@/infra/http/errors/map-domain-error-to-http-exception'
import { SearchRecipesUseCase } from '@/domain/application/use-cases/search-recipes/search-recipes'
import { Public } from '@/infra/auth/public'
import { RecipeListItemPresenter } from '../presenters/recipe-list-item-presenter'
import type { Request } from 'express'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { RecipeSearchScope } from '@/domain/application/repositories/recipes-repository'
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
} from '@/core/repositories/pagination-params'
import { IngredientMatchMode } from '@/domain/application/use-cases/search-recipes/search-recipes-params'

const stringOrStringArraySchema = z.union([z.string(), z.array(z.string())])

const searchRecipesQuerySchema = z.object({
  scope: z
    .enum([RecipeSearchScope.GLOBAL, RecipeSearchScope.MINE])
    .optional()
    .default(RecipeSearchScope.GLOBAL),
  query: z.string().max(100).optional(),
  ingredients: stringOrStringArraySchema.optional().transform((value) => {
    if (value === undefined) {
      return undefined
    }

    return Array.isArray(value) ? value : [value]
  }),
  ingredientMatch: z
    .enum([IngredientMatchMode.ALL, IngredientMatchMode.ANY])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(DEFAULT_PAGE),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PER_PAGE)
    .optional()
    .default(DEFAULT_PER_PAGE),
})

const queryValidationPipe = new ZodValidationPipe(searchRecipesQuerySchema)

type SearchRecipesQuerySchema = z.infer<typeof searchRecipesQuerySchema>

@Controller('/recipes')
export class SearchRecipesController {
  constructor(private searchRecipes: SearchRecipesUseCase) {}

  @Public()
  @Get()
  async handle(
    @Query(queryValidationPipe)
    {
      scope,
      query: textQuery,
      ingredients,
      ingredientMatch,
      page,
      perPage,
    }: SearchRecipesQuerySchema,
    @Req() request: Request,
  ) {
    const user = request.user as UserPayload | undefined

    if (scope === RecipeSearchScope.MINE && !user?.sub) {
      throw new UnauthorizedException()
    }

    const result = await this.searchRecipes.execute({
      scope,
      query: textQuery,
      ingredients,
      ingredientMatch,
      page,
      perPage,
      actorId: user?.sub,
    })

    if (result.isLeft()) {
      throw mapDomainErrorToHttpException(result.value)
    }

    const { listReadModel, result: paginatedResult } = result.value

    return {
      items: paginatedResult.items.map((item) =>
        RecipeListItemPresenter.toHTTP(item, listReadModel),
      ),
      meta: paginatedResult.meta,
    }
  }
}

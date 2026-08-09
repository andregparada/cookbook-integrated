import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '@/core/repositories/pagination-params'
import { PaginatedResult } from '@/core/repositories/paginated-result'
import { Injectable } from '@nestjs/common'
import { RecipeSummary } from '@/domain/enterprise/entities/value-objects/recipe-summary'
import {
  RecipeSearchScope,
  RecipesRepository,
} from '../repositories/recipes-repository'

interface SearchRecipesUseCaseRequest {
  scope?: RecipeSearchScope
  page?: number
  perPage?: number
  actorId?: string
}

type SearchRecipesUseCaseResponse = Either<
  NotAllowedError,
  {
    result: PaginatedResult<RecipeSummary>
  }
>

@Injectable()
export class SearchRecipesUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute(
    request: SearchRecipesUseCaseRequest,
  ): Promise<SearchRecipesUseCaseResponse> {
    const scope = request.scope ?? RecipeSearchScope.GLOBAL
    const page = request.page ?? DEFAULT_PAGE
    const perPage = request.perPage ?? DEFAULT_PER_PAGE

    if (scope === RecipeSearchScope.MINE) {
      if (!request.actorId) {
        return left(new NotAllowedError())
      }

      const result = await this.recipesRepository.findMany({
        scope: RecipeSearchScope.MINE,
        actorId: request.actorId,
        page,
        perPage,
      })

      return right({ result })
    }

    const result = await this.recipesRepository.findMany({
      scope: RecipeSearchScope.GLOBAL,
      page,
      perPage,
    })

    return right({ result })
  }
}

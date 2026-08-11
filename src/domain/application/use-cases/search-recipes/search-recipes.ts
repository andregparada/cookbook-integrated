import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '@/core/repositories/pagination-params'
import { PaginatedResult } from '@/core/repositories/paginated-result'
import { Injectable } from '@nestjs/common'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import {
  normalizeCatalogFilters,
  RecipeListReadModel,
  RecipeSearchScope,
  resolveRecipeListReadModel,
  SearchRecipesInput,
} from './search-recipes-params'
import { RecipesRepository } from '../../repositories/recipes-repository'

type SearchRecipesUseCaseResponse = Either<
  NotAllowedError,
  {
    listReadModel: RecipeListReadModel
    result: PaginatedResult<RecipeListItem>
  }
>

@Injectable()
export class SearchRecipesUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute(
    request: SearchRecipesInput,
  ): Promise<SearchRecipesUseCaseResponse> {
    const scope = request.scope ?? RecipeSearchScope.GLOBAL
    const page = request.page ?? DEFAULT_PAGE
    const perPage = request.perPage ?? DEFAULT_PER_PAGE
    const catalogFilters = normalizeCatalogFilters(request)
    const listReadModel = resolveRecipeListReadModel(scope, catalogFilters)

    if (scope === RecipeSearchScope.MINE) {
      if (!request.actorId) {
        return left(new NotAllowedError())
      }

      const result = await this.recipesRepository.findMany({
        scope: RecipeSearchScope.MINE,
        actorId: request.actorId,
        page,
        perPage,
        listReadModel,
        ...catalogFilters,
      })

      return right({ listReadModel, result })
    }

    const result = await this.recipesRepository.findMany({
      scope: RecipeSearchScope.GLOBAL,
      page,
      perPage,
      listReadModel,
      ...catalogFilters,
    })

    return right({ listReadModel, result })
  }
}

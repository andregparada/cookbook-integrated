import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
} from '@/core/repositories/pagination-params'
import {
  buildPaginatedResult,
  PaginatedResult,
} from '@/core/repositories/paginated-result'
import { Injectable } from '@nestjs/common'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import {
  IngredientMatchMode,
  normalizeCatalogFilters,
  RecipeListReadModel,
  RecipeSearchScope,
  resolveRecipeListReadModel,
  SearchRecipesCatalogFilters,
  SearchRecipesInput,
} from './search-recipes-params'
import { RecipesRepository } from '../../repositories/recipes-repository'
import { SearchIngredientTermsResolver } from '../../services/search-ingredient-terms-resolver'

type SearchRecipesUseCaseResponse = Either<
  NotAllowedError,
  {
    listReadModel: RecipeListReadModel
    result: PaginatedResult<RecipeListItem>
  }
>

@Injectable()
export class SearchRecipesUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private searchIngredientTermsResolver: SearchIngredientTermsResolver,
  ) {}

  async execute(
    request: SearchRecipesInput,
  ): Promise<SearchRecipesUseCaseResponse> {
    const scope = request.scope ?? RecipeSearchScope.GLOBAL
    const page = request.page ?? DEFAULT_PAGE
    const perPage = request.perPage ?? DEFAULT_PER_PAGE
    const catalogFilters = normalizeCatalogFilters(request)
    const listReadModel = resolveRecipeListReadModel(scope, catalogFilters)
    const resolvedCatalogFilters =
      await this.resolveIngredientFilters(catalogFilters)

    if (resolvedCatalogFilters.shouldShortCircuit) {
      return right({
        listReadModel,
        result: buildPaginatedResult([], page, perPage, 0),
      })
    }

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
        ...resolvedCatalogFilters.filters,
      })

      return right({ listReadModel, result })
    }

    const result = await this.recipesRepository.findMany({
      scope: RecipeSearchScope.GLOBAL,
      page,
      perPage,
      listReadModel,
      ...resolvedCatalogFilters.filters,
    })

    return right({ listReadModel, result })
  }

  private async resolveIngredientFilters(
    catalogFilters: SearchRecipesCatalogFilters,
  ): Promise<
    | { shouldShortCircuit: true }
    | { shouldShortCircuit: false; filters: SearchRecipesCatalogFilters }
  > {
    if (!catalogFilters.ingredients) {
      return {
        shouldShortCircuit: false,
        filters: catalogFilters,
      }
    }

    const ingredientMatch =
      catalogFilters.ingredientMatch ?? IngredientMatchMode.ALL

    const { resolvedIds, hasUnresolved } =
      await this.searchIngredientTermsResolver.resolve(
        catalogFilters.ingredients,
      )

    if (hasUnresolved && ingredientMatch === IngredientMatchMode.ALL) {
      return { shouldShortCircuit: true }
    }

    if (resolvedIds.length === 0) {
      return { shouldShortCircuit: true }
    }

    return {
      shouldShortCircuit: false,
      filters: {
        ...catalogFilters,
        ingredients: resolvedIds,
        ingredientMatch,
      },
    }
  }
}

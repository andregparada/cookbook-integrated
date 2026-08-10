import { PaginationParams } from '@/core/repositories/pagination-params'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'

export enum RecipeSearchScope {
  GLOBAL = 'global',
  MINE = 'mine',
}

export enum IngredientMatchMode {
  ALL = 'ALL',
  ANY = 'ANY',
}

export enum TagMatchMode {
  ALL = 'ALL',
  ANY = 'ANY',
}

export enum RecipeSearchSortBy {
  CREATED_AT_DESC = 'createdAtDesc',
  TOTAL_TIME_ASC = 'totalTimeAsc',
  NAME_ASC = 'nameAsc',
}

export enum RecipeListReadModel {
  CATALOG_CARD = 'catalogCard',
  AUTHOR_WORKSPACE_ITEM = 'authorWorkspaceItem',
  SEARCH_RESULT_ITEM = 'searchResultItem',
}

export interface SearchRecipesCatalogFilters {
  query?: string
  ingredients?: string[]
  ingredientMatch?: IngredientMatchMode
  excludeIngredients?: string[]
  tags?: string[]
  tagMatch?: TagMatchMode
  difficultyLevel?: DifficultyLevel[]
  maxTotalTimeInMinutes?: number
  includeUnspecifiedTime?: boolean
  authorUserName?: string
  sortBy?: RecipeSearchSortBy
  minServings?: number
  pantryIngredients?: string[]
  minCoveragePercent?: number
}

export type SearchRecipesParams = PaginationParams &
  SearchRecipesCatalogFilters & {
    listReadModel: RecipeListReadModel
  } & (
    | { scope: RecipeSearchScope.GLOBAL }
    | { scope: RecipeSearchScope.MINE; actorId: string }
  )

export type SearchRecipesInput = Partial<SearchRecipesCatalogFilters> & {
  scope?: RecipeSearchScope
  actorId?: string
  page?: number
  perPage?: number
}

function omitEmptyString(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : undefined
}

function omitEmptyArray<T>(value: T[] | undefined): T[] | undefined {
  if (value === undefined || value.length === 0) {
    return undefined
  }

  return value
}

export function normalizeCatalogFilters(
  input: Partial<SearchRecipesCatalogFilters>,
): SearchRecipesCatalogFilters {
  return {
    query: omitEmptyString(input.query),
    ingredients: omitEmptyArray(input.ingredients),
    ingredientMatch: input.ingredientMatch,
    excludeIngredients: omitEmptyArray(input.excludeIngredients),
    tags: omitEmptyArray(input.tags),
    tagMatch: input.tagMatch,
    difficultyLevel: omitEmptyArray(input.difficultyLevel),
    maxTotalTimeInMinutes: input.maxTotalTimeInMinutes,
    includeUnspecifiedTime: input.includeUnspecifiedTime,
    authorUserName: omitEmptyString(input.authorUserName),
    sortBy: input.sortBy,
    minServings: input.minServings,
    pantryIngredients: omitEmptyArray(input.pantryIngredients),
    minCoveragePercent: input.minCoveragePercent,
  }
}

export function hasCatalogFilters(
  params: SearchRecipesCatalogFilters,
): boolean {
  return (
    params.query !== undefined ||
    params.ingredients !== undefined ||
    params.excludeIngredients !== undefined ||
    params.tags !== undefined ||
    params.difficultyLevel !== undefined ||
    params.maxTotalTimeInMinutes !== undefined ||
    params.authorUserName !== undefined ||
    params.minServings !== undefined ||
    params.pantryIngredients !== undefined
  )
}

export function resolveRecipeListReadModel(
  scope: RecipeSearchScope,
  params: SearchRecipesCatalogFilters,
): RecipeListReadModel {
  if (hasCatalogFilters(params)) {
    return RecipeListReadModel.SEARCH_RESULT_ITEM
  }

  if (scope === RecipeSearchScope.MINE) {
    return RecipeListReadModel.AUTHOR_WORKSPACE_ITEM
  }

  return RecipeListReadModel.CATALOG_CARD
}

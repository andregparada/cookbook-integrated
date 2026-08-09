import { PaginatedResult } from '@/core/repositories/paginated-result'
import { PaginationParams } from '@/core/repositories/pagination-params'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'
import { RecipeSummary } from '@/domain/enterprise/entities/value-objects/recipe-summary'

export enum RecipeSearchScope {
  GLOBAL = 'global',
  MINE = 'mine',
}

export type SearchRecipesParams = PaginationParams &
  (
    | { scope: RecipeSearchScope.GLOBAL }
    | { scope: RecipeSearchScope.MINE; actorId: string }
  )

export abstract class RecipesRepository {
  abstract findById(id: string): Promise<Recipe | null>
  abstract findDetailsById(id: string): Promise<RecipeDetails | null>
  abstract findMany(
    params: SearchRecipesParams,
  ): Promise<PaginatedResult<RecipeSummary>>

  abstract create(recipe: Recipe): Promise<void>
  abstract save(recipe: Recipe): Promise<void>
}

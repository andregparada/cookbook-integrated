import { PaginatedResult } from '@/core/repositories/paginated-result'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import { SearchRecipesParams } from '../use-cases/search-recipes/search-recipes-params'

export {
  RecipeSearchScope,
  type SearchRecipesParams,
} from '../use-cases/search-recipes/search-recipes-params'

export abstract class RecipesRepository {
  abstract findById(id: string): Promise<Recipe | null>
  abstract findDetailsById(id: string): Promise<RecipeDetails | null>
  abstract findMany(
    params: SearchRecipesParams,
  ): Promise<PaginatedResult<RecipeListItem>>

  abstract create(recipe: Recipe): Promise<void>
  abstract save(recipe: Recipe): Promise<void>
}

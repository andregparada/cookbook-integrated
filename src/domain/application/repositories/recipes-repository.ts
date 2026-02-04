import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

export abstract class RecipesRepository {
  abstract findById(id: string): Promise<Recipe | null>
  abstract findDetailsBySlug(slug: string): Promise<RecipeDetails | null>
  abstract create(recipe: Recipe): Promise<void>
  abstract save(recipe: Recipe): Promise<void>
}

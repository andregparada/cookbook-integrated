import { Recipe } from '@/domain/enterprise/entities/recipe'

export abstract class RecipesRepository {
  abstract findById(id: string): Promise<Recipe | null>
  abstract create(recipe: Recipe): Promise<void>
  abstract save(recipe: Recipe): Promise<void>
}

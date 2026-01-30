import { Recipe } from '@/domain/enterprise/entities/recipe'

export abstract class RecipesRepository {
  abstract create(recipe: Recipe): Promise<void>
}

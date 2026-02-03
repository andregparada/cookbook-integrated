import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract findById(id: string): Promise<RecipeIngredient | null>
  abstract create(recipeIngredient: RecipeIngredient): Promise<void>
}

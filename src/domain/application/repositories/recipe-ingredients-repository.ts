import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract create(recipeIngredient: RecipeIngredient): Promise<void>
}

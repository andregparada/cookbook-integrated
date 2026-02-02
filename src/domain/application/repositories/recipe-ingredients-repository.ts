import { RecipeIngredient } from '@/domain/enterprise/entities/value-objects/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract create(recipeIngredient: RecipeIngredient): Promise<void>
}

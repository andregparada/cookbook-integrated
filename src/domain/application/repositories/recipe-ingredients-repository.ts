import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract findManyByRecipeId(recipeId: string): Promise<RecipeIngredient[]>
}

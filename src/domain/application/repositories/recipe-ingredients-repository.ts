import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract findById(id: string): Promise<RecipeIngredient | null>
  abstract findManyByRecipeId(recipeId: string): Promise<RecipeIngredient[]>
  abstract createMany(items: RecipeIngredient[]): Promise<void>
  abstract deleteMany(items: RecipeIngredient[]): Promise<void>
}

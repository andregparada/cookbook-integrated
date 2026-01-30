import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export abstract class RecipeIngredientsRepository {
  abstract findByNormalizedName(
    normalizedName: string,
  ): Promise<RecipeIngredient | null>

  abstract create(recipeIngredient: RecipeIngredient): Promise<void>
}

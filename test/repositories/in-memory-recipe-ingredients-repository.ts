import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { RecipeIngredient } from '@/domain/enterprise/entities/value-objects/recipe-ingredient'

export class InMemoryRecipeIngredientsRepository implements RecipeIngredientsRepository {
  public items: RecipeIngredient[] = []

  async create(recipeIngredient: RecipeIngredient) {
    this.items.push(recipeIngredient)
  }
}

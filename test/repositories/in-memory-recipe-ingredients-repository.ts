import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export class InMemoryRecipeIngredientsRepository implements RecipeIngredientsRepository {
  public items: RecipeIngredient[] = []

  async findById(id: string) {
    const recipeIngredient = this.items.find(
      (item) => item.id.toString() === id,
    )

    if (!recipeIngredient) {
      return null
    }

    return recipeIngredient
  }

  async create(recipeIngredient: RecipeIngredient) {
    this.items.push(recipeIngredient)
  }
}

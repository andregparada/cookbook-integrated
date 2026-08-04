import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

export class InMemoryRecipeIngredientsRepository implements RecipeIngredientsRepository {
  public items: RecipeIngredient[] = []

  async findManyByRecipeId(recipeId: string) {
    return this.items.filter((item) => item.recipeId.toString() === recipeId)
  }

  async createMany(items: RecipeIngredient[]) {
    this.items.push(...items)
  }

  async deleteMany(items: RecipeIngredient[]) {
    this.items = this.items.filter((item) => {
      return !items.some((toDelete) => toDelete.equals(item))
    })
  }
}

import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Recipe } from '@/domain/enterprise/entities/recipe'

export class InMemoryRecipesRepository implements RecipesRepository {
  public items: Recipe[] = []

  async findById(id: string) {
    const recipe = this.items.find((item) => item.id.toString() === id)

    if (!recipe) {
      return null
    }

    return recipe
  }

  async create(recipe: Recipe) {
    this.items.push(recipe)
  }

  async save(recipe: Recipe) {
    const recipeIndex = this.items.findIndex((item) => item.id === recipe.id)

    this.items[recipeIndex] = recipe
  }
}

import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Recipe } from '@/domain/enterprise/entities/recipe'

export class InMemoryRecipesRepository implements RecipesRepository {
  public items: Recipe[] = []

  async create(recipe: Recipe) {
    this.items.push(recipe)
  }
}

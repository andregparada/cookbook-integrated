import { IngredientsRepository } from '@/domain/application/repositories/ingredients-repository'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'

export class InMemoryIngredientsRepository implements IngredientsRepository {
  public items: Ingredient[] = []

  async findByNormalizedName(normalizedName: string) {
    const ingredient = this.items.find(
      (item) => item.slug.value === normalizedName,
    )

    if (!ingredient) {
      return null
    }

    return ingredient
  }

  async create(ingredient: Ingredient) {
    this.items.push(ingredient)
  }
}

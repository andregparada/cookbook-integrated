import { IngredientsRepository } from '@/domain/application/repositories/ingredients-repository'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

export class InMemoryIngredientsRepository implements IngredientsRepository {
  public items: Ingredient[] = []

  async findById(id: string) {
    const ingredient = this.items.find((item) => item.id.toString() === id)

    if (!ingredient) {
      return null
    }

    return ingredient
  }

  async findByNormalizedName(normalizedName: NormalizedName) {
    const ingredient = this.items.find(
      (item) => item.normalizedName.value === normalizedName.value,
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

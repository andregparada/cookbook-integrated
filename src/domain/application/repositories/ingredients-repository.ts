import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

export abstract class IngredientsRepository {
  abstract findById(id: string): Promise<Ingredient | null>

  abstract findByNormalizedName(
    normalizedName: NormalizedName,
  ): Promise<Ingredient | null>

  abstract create(ingredient: Ingredient): Promise<void>
}

import { Ingredient } from '@/domain/enterprise/entities/ingredient'

export abstract class IngredientsRepository {
  abstract findByNormalizedName(
    normalizedName: string,
  ): Promise<Ingredient | null>

  abstract create(ingredient: Ingredient): Promise<void>
}

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { Prisma, Ingredient as PrismaIngredient } from '@prisma/client'

export class PrismaIngredientMapper {
  static toDomain(raw: PrismaIngredient): Ingredient {
    return Ingredient.create(
      {
        name: raw.name,
        normalizedName: NormalizedName.create(raw.normalizedName),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    ingredient: Ingredient,
  ): Prisma.IngredientUncheckedCreateInput {
    return {
      id: ingredient.id.toString(),
      name: ingredient.name,
      normalizedName: ingredient.normalizedName.value,
    }
  }
}

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import {
  Prisma,
  RecipeIngredient as PrismaRecipeIngredient,
} from '@prisma/client'

export class PrismaRecipeIngredientMapper {
  static toDomain(raw: PrismaRecipeIngredient): RecipeIngredient {
    if (raw.amount === null || raw.unit === null) {
      throw new Error('Invalid recipe ingredient data')
    }

    return RecipeIngredient.create(
      {
        recipeId: new UniqueEntityID(raw.recipeId),
        ingredientId: new UniqueEntityID(raw.ingredientId),
        amount: raw.amount,
        unit: raw.unit,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(
    recipeingredient: RecipeIngredient,
  ): Prisma.RecipeIngredientUncheckedCreateInput {
    return {
      id: recipeingredient.id.toString(),
      recipeId: recipeingredient.recipeId.toString(),
      ingredientId: recipeingredient.ingredientId.toString(),
      amount: recipeingredient.amount,
      unit: recipeingredient.unit,
    }
  }
}

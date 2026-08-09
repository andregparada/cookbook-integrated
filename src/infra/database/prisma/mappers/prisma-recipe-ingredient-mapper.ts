import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import {
  Prisma,
  RecipeIngredient as PrismaRecipeIngredient,
} from '@prisma/client'
import {
  mapMeasurementUnitToDomain,
  mapMeasurementUnitToPrisma,
} from './enum-mappers'

export class PrismaRecipeIngredientMapper {
  static toDomain(raw: PrismaRecipeIngredient): RecipeIngredient {
    return RecipeIngredient.create(
      {
        recipeId: new UniqueEntityID(raw.recipeId),
        ingredientId: new UniqueEntityID(raw.ingredientId),
        amount: raw.amount,
        unit: mapMeasurementUnitToDomain(raw.unit),
        position: raw.position,
        note: raw.note,
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
      unit: mapMeasurementUnitToPrisma(recipeingredient.unit),
      position: recipeingredient.position,
      note: recipeingredient.note,
    }
  }
}

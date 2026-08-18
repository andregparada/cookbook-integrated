import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  MeasurementUnit,
  RecipeIngredient,
  RecipeIngredientProps,
} from '@/domain/enterprise/entities/recipe-ingredient'

export function makeRecipeIngredient(
  override: Partial<RecipeIngredientProps> = {},
  id?: UniqueEntityID,
) {
  const recipeIngredient = RecipeIngredient.create(
    {
      recipeId: new UniqueEntityID(),
      ingredientId: new UniqueEntityID(),
      amount: 1,
      unit: MeasurementUnit.CUP,
      position: 0,
      note: null,
      ...override,
    },
    id,
  )

  return recipeIngredient
}

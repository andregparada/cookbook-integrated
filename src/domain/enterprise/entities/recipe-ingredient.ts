import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export enum MeasurementUnit {
  GRAM = 'gram',
  KILOGRAM = 'kilogram',
  MILLILITER = 'milliliter',
  LITER = 'liter',
  CUP = 'cup',
  TABLESPOON = 'tablespoon',
  TEASPOON = 'teaspoon',
  PINCH = 'pinch',
  DASH = 'dash',
  DROP = 'drop',
  GLASS = 'glass',
  BOWL = 'bowl',
  UNIT = 'unit',
  CLOVE = 'clove',
  SLICE = 'slice',
  PIECE = 'piece',
  BUNCH = 'bunch',
  SPRIG = 'sprig',
  HEAD = 'head',
  STALK = 'stalk',
  CAN = 'can',
  JAR = 'jar',
  BOTTLE = 'bottle',
  BOX = 'box',
  PACKAGE = 'package',
  SACHET = 'sachet',
  TO_TASTE = 'to_taste',
}

export interface RecipeIngredientProps {
  recipeId: UniqueEntityID
  ingredientId: UniqueEntityID
  amount: number | null
  unit: MeasurementUnit
  position: number
  note: string | null
}

export class RecipeIngredient extends Entity<RecipeIngredientProps> {
  get recipeId() {
    return this.props.recipeId
  }

  get ingredientId() {
    return this.props.ingredientId
  }

  get amount() {
    return this.props.amount
  }

  get unit() {
    return this.props.unit
  }

  get position() {
    return this.props.position
  }

  get note() {
    return this.props.note
  }

  hasValidMeasurement(): boolean {
    return this.unit === MeasurementUnit.TO_TASTE
      ? this.amount === null
      : this.amount !== null && this.amount > 0
  }

  static create(props: RecipeIngredientProps, id?: UniqueEntityID) {
    const recipeIngredient = new RecipeIngredient(props, id)
    return recipeIngredient
  }
}

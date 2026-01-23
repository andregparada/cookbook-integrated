import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface RecipeIngredientProps {
  recipeId: UniqueEntityID
  ingredientId: UniqueEntityID
  amount: number
  unit: string
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

  static create(props: RecipeIngredientProps, id?: UniqueEntityID) {
    const recipeIngredient = new RecipeIngredient(props, id)
    return recipeIngredient
  }
}

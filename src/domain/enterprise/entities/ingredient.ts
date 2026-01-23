import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'

export interface IngredientProps {
  name: string
  createdAt: Date
  updatedAt?: Date | null
}

export class Ingredient extends Entity<IngredientProps> {
  get name() {
    return this.props.name
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<IngredientProps, 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    const ingredient = new Ingredient(
      {
        ...props,
        createdAt: new Date(),
      },
      id,
    )
    return ingredient
  }
}

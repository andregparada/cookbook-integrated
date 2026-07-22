import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { NormalizedName } from './value-objects/normalized-name'

export interface IngredientProps {
  name: string // TODO normalizar para titulo
  normalizedName: NormalizedName
  createdAt: Date
  updatedAt?: Date | null
}

export class Ingredient extends Entity<IngredientProps> {
  get name() {
    return this.props.name
  }

  get normalizedName() {
    return this.props.normalizedName
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
    props: Optional<IngredientProps, 'createdAt' | 'normalizedName'>,
    id?: UniqueEntityID,
  ) {
    const ingredient = new Ingredient(
      {
        ...props,
        normalizedName:
          props.normalizedName ?? NormalizedName.createFromText(props.name),
        createdAt: new Date(),
      },
      id,
    )
    return ingredient
  }
}

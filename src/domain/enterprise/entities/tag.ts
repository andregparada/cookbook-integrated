import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Slug } from './value-objects/slug'

export interface TagProps {
  name: string // TODO normalizar para titulo
  slug: Slug
  createdAt: Date
  updatedAt?: Date | null
}

export class Tag extends Entity<TagProps> {
  get name() {
    return this.props.name
  }

  get slug() {
    return this.props.slug
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
    props: Optional<TagProps, 'createdAt' | 'slug'>,
    id?: UniqueEntityID,
  ) {
    const tag = new Tag(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.name),
        createdAt: new Date(),
      },
      id,
    )
    return tag
  }
}

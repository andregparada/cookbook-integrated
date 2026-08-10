import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from './slug'
import { ValueObject } from '@/core/entities/value-objects'
import { Tag } from '../tag'

export interface RecipeCatalogCardProps {
  recipeId: UniqueEntityID
  name: string
  slug: Slug
  description: string | null
  tags: Tag[]
}

export class RecipeCatalogCard extends ValueObject<RecipeCatalogCardProps> {
  get recipeId() {
    return this.props.recipeId
  }

  get name() {
    return this.props.name
  }

  get slug() {
    return this.props.slug
  }

  get description() {
    return this.props.description
  }

  get tags() {
    return this.props.tags
  }

  static create(props: RecipeCatalogCardProps) {
    return new RecipeCatalogCard(props)
  }
}

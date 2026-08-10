import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipeStatus } from '../recipe'
import { Slug } from './slug'
import { ValueObject } from '@/core/entities/value-objects'
import { Tag } from '../tag'

export interface RecipeAuthorWorkspaceItemProps {
  recipeId: UniqueEntityID
  name: string
  slug: Slug
  status: RecipeStatus
  description: string | null
  tags: Tag[]
}

export class RecipeAuthorWorkspaceItem extends ValueObject<RecipeAuthorWorkspaceItemProps> {
  get recipeId() {
    return this.props.recipeId
  }

  get name() {
    return this.props.name
  }

  get slug() {
    return this.props.slug
  }

  get status() {
    return this.props.status
  }

  get description() {
    return this.props.description
  }

  get tags() {
    return this.props.tags
  }

  static create(props: RecipeAuthorWorkspaceItemProps) {
    return new RecipeAuthorWorkspaceItem(props)
  }
}

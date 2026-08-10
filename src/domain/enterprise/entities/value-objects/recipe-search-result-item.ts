import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DifficultyLevel } from '../recipe'
import { Slug } from './slug'
import { ValueObject } from '@/core/entities/value-objects'
import { Tag } from '../tag'

export interface RecipeSearchResultItemProps {
  recipeId: UniqueEntityID
  name: string
  slug: Slug
  description: string | null
  tags: Tag[]
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  difficultyLevel: DifficultyLevel | null
  author: string
}

export class RecipeSearchResultItem extends ValueObject<RecipeSearchResultItemProps> {
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

  get prepTimeInMinutes() {
    return this.props.prepTimeInMinutes
  }

  get cookTimeInMinutes() {
    return this.props.cookTimeInMinutes
  }

  get difficultyLevel() {
    return this.props.difficultyLevel
  }

  get author() {
    return this.props.author
  }

  static create(props: RecipeSearchResultItemProps) {
    return new RecipeSearchResultItem(props)
  }
}

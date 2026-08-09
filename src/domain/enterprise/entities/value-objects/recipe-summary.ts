import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DifficultyLevel, RecipeStatus } from '../recipe'
import { Slug } from './slug'
import { ValueObject } from '@/core/entities/value-objects'
import { Tag } from '../tag'

export interface RecipeSummaryProps {
  authorId: UniqueEntityID
  author: string
  recipeId: UniqueEntityID
  name: string
  slug: Slug
  description: string | null
  prepTimeInMinutes?: number | null
  cookTimeInMinutes?: number | null
  servings?: number | null
  difficultyLevel: DifficultyLevel | null
  status: RecipeStatus
  publishedAt: Date | null
  tags: Tag[]
  createdAt: Date
  updatedAt?: Date | null
}

export class RecipeSummary extends ValueObject<RecipeSummaryProps> {
  get authorId() {
    return this.props.authorId
  }

  get author() {
    return this.props.author
  }

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

  get prepTimeInMinutes() {
    return this.props.prepTimeInMinutes
  }

  get cookTimeInMinutes() {
    return this.props.cookTimeInMinutes
  }

  get servings() {
    return this.props.servings
  }

  get difficultyLevel() {
    return this.props.difficultyLevel
  }

  get status() {
    return this.props.status
  }

  get publishedAt() {
    return this.props.publishedAt
  }

  get tags() {
    return this.props.tags
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(props: RecipeSummaryProps) {
    return new RecipeSummary(props)
  }
}

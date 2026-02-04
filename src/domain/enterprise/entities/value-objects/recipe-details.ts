import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DifficultyLevel } from '../recipe'
import { Slug } from './slug'
import { ValueObject } from '@/core/entities/value-objects'
import { Tag } from '../tag'
import { RecipeIngredient } from '../recipe-ingredient'

export interface RecipeDetailsProps {
  authorId: UniqueEntityID
  author: string
  recipeId: UniqueEntityID
  name: string
  slug: Slug
  description: string
  instructions: string
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  servings: number | null
  difficultyLevel: DifficultyLevel
  tags: Tag[]
  recipeIngredients: RecipeIngredient[]
  createdAt: Date
  updatedAt?: Date | null
}

export class RecipeDetails extends ValueObject<RecipeDetailsProps> {
  get authorId() {
    return this.props.authorId
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

  get instructions() {
    return this.props.instructions
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

  get tags() {
    return this.props.tags
  }

  get recipeIngredients() {
    return this.props.recipeIngredients
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  static create(props: RecipeDetailsProps) {
    return new RecipeDetails(props)
  }
}

import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { Slug } from './value-objects/slug'

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface RecipeProps {
  title: string
  slug: Slug
  description: string
  instructions: string
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  servings: number | null
  difficultyLevel: DifficultyLevel
  authorId: UniqueEntityID
  tagsIds: UniqueEntityID[]
  recipeIngredientsIds: UniqueEntityID[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Recipe extends Entity<RecipeProps> {
  get title() {
    return this.props.title
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

  get authorId() {
    return this.props.authorId
  }

  get tagsIds() {
    return this.props.tagsIds
  }

  get recipeIngredients() {
    return this.props.recipeIngredientsIds
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
    props: Optional<
      RecipeProps,
      | 'slug'
      | 'createdAt'
      | 'tagsIds'
      | 'recipeIngredientsIds'
      | 'prepTimeInMinutes'
      | 'cookTimeInMinutes'
      | 'servings'
    >,
    id?: UniqueEntityID,
  ) {
    const recipe = new Recipe(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.title),
        tagsIds: props.tagsIds ?? [],
        recipeIngredientsIds: props.recipeIngredientsIds ?? [],
        prepTimeInMinutes: props.prepTimeInMinutes ?? 0,
        cookTimeInMinutes: props.cookTimeInMinutes ?? 0,
        servings: props.servings ?? 1,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
    return recipe
  }
}

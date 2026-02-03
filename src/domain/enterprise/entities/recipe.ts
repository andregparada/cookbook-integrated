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
  authorId: UniqueEntityID
  name: string
  slug: Slug
  description: string
  instructions: string
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  servings: number | null
  difficultyLevel: DifficultyLevel
  tagsIds: UniqueEntityID[]
  recipeIngredientsIds: UniqueEntityID[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Recipe extends Entity<RecipeProps> {
  get authorId() {
    return this.props.authorId
  }

  get name() {
    return this.props.name
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  get slug() {
    return this.props.slug
  }

  get description() {
    return this.props.description
  }

  set description(description: string) {
    this.props.description = description
    this.touch()
  }

  get instructions() {
    return this.props.instructions
  }

  set instructions(instructions: string) {
    this.props.instructions = instructions
    this.touch()
  }

  get prepTimeInMinutes() {
    return this.props.prepTimeInMinutes
  }

  set prepTimeInMinutes(prepTimeInMinutes: number | null) {
    this.props.prepTimeInMinutes = prepTimeInMinutes
    this.touch()
  }

  get cookTimeInMinutes() {
    return this.props.cookTimeInMinutes
  }

  set cookTimeInMinutes(cookTimeInMinutes: number | null) {
    this.props.cookTimeInMinutes = cookTimeInMinutes
    this.touch()
  }

  get servings() {
    return this.props.servings
  }

  set servings(servings: number | null) {
    this.props.servings = servings
    this.touch()
  }

  get difficultyLevel() {
    return this.props.difficultyLevel
  }

  set difficultyLevel(difficultyLevel: DifficultyLevel) {
    this.props.difficultyLevel = difficultyLevel
    this.touch()
  }

  get tagsIds() {
    return this.props.tagsIds
  }

  set tagsIds(tagsIds: UniqueEntityID[]) {
    this.props.tagsIds = tagsIds
    this.touch()
  }

  get recipeIngredientsIds() {
    return this.props.recipeIngredientsIds
  }

  set recipeIngredientsIds(recipeIngredientsIds: UniqueEntityID[]) {
    this.props.recipeIngredientsIds = recipeIngredientsIds
    this.touch()
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
        slug: props.slug ?? Slug.createFromText(props.name),
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

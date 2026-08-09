import { AggregateRoot } from '@/core/entities/aggregate-root'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { RecipeNotPublishableError } from '../errors/recipe-not-publishable-error'
import { RecipeIngredientList } from './recipe-ingredient-list'
import { Slug } from './value-objects/slug'

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum RecipeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface RecipeProps {
  authorId: UniqueEntityID
  name: string
  slug: Slug
  description: string | null
  instructions: string
  prepTimeInMinutes: number | null
  cookTimeInMinutes: number | null
  servings: number | null
  difficultyLevel: DifficultyLevel | null
  status: RecipeStatus
  publishedAt: Date | null
  deletedAt: Date | null
  tagsIds: UniqueEntityID[]
  ingredients: RecipeIngredientList
  createdAt: Date
  updatedAt?: Date | null
}

export class Recipe extends AggregateRoot<RecipeProps> {
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

  set description(description: string | null) {
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

  set difficultyLevel(difficultyLevel: DifficultyLevel | null) {
    this.props.difficultyLevel = difficultyLevel
    this.touch()
  }

  get status() {
    return this.props.status
  }

  get publishedAt() {
    return this.props.publishedAt
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get tagsIds() {
    return this.props.tagsIds
  }

  set tagsIds(tagsIds: UniqueEntityID[]) {
    this.props.tagsIds = tagsIds
    this.touch()
  }

  get ingredients() {
    return this.props.ingredients
  }

  set ingredients(ingredients: RecipeIngredientList) {
    this.props.ingredients = ingredients
    this.touch()
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  getPublishabilityIssues(): string[] {
    const issues: string[] = []

    if (!this.name.trim()) {
      issues.push('name')
    }

    if (!this.instructions.trim()) {
      issues.push('instructions')
    }

    if (this.ingredients.getItems().length === 0) {
      issues.push('ingredients')
    }

    return issues
  }

  assertPublishable(): void {
    const issues = this.getPublishabilityIssues()

    if (issues.length > 0) {
      throw new RecipeNotPublishableError(issues)
    }
  }

  publish(): void {
    this.assertPublishable()

    if (this.props.publishedAt === null) {
      this.props.publishedAt = new Date()
    }

    this.props.status = RecipeStatus.PUBLISHED
    this.touch()
  }

  unpublish(): void {
    this.props.status = RecipeStatus.DRAFT
    this.touch()
  }

  softDelete(): void {
    this.props.deletedAt = new Date()
    this.touch()
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
      | 'ingredients'
      | 'prepTimeInMinutes'
      | 'cookTimeInMinutes'
      | 'servings'
      | 'status'
      | 'publishedAt'
      | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ) {
    const recipe = new Recipe(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.name),
        tagsIds: props.tagsIds ?? [],
        ingredients: props.ingredients ?? new RecipeIngredientList(),
        prepTimeInMinutes:
          props.prepTimeInMinutes === undefined ? 0 : props.prepTimeInMinutes,
        cookTimeInMinutes:
          props.cookTimeInMinutes === undefined ? 0 : props.cookTimeInMinutes,
        servings: props.servings === undefined ? 1 : props.servings,
        status: props.status ?? RecipeStatus.DRAFT,
        publishedAt: props.publishedAt ?? null,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
    return recipe
  }
}

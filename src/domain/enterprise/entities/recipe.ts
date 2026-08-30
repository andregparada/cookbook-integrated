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

export type UpdateRecipeContentProps = {
  name?: string
  description?: string | null
  instructions?: string
  prepTimeInMinutes?: number | null
  cookTimeInMinutes?: number | null
  servings?: number | null
  difficultyLevel?: DifficultyLevel | null
  tagsIds?: UniqueEntityID[]
  ingredients?: RecipeIngredientList
}

export class Recipe extends AggregateRoot<RecipeProps> {
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

  get ingredients() {
    return this.props.ingredients
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

  getTimingAndServingsIssues(): string[] {
    const issues: string[] = []

    if (
      this.prepTimeInMinutes !== null &&
      (!Number.isInteger(this.prepTimeInMinutes) || this.prepTimeInMinutes < 0)
    ) {
      issues.push('prepTimeInMinutes')
    }

    if (
      this.cookTimeInMinutes !== null &&
      (!Number.isInteger(this.cookTimeInMinutes) || this.cookTimeInMinutes < 0)
    ) {
      issues.push('cookTimeInMinutes')
    }

    if (
      this.servings !== null &&
      (!Number.isInteger(this.servings) || this.servings < 1)
    ) {
      issues.push('servings')
    }

    return issues
  }

  getIngredientMeasurementIssues(): string[] {
    return this.ingredients
      .getItems()
      .flatMap((item, index) =>
        item.hasValidMeasurement() ? [] : [`recipeIngredients[${index}]`],
      )
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

  updateContent(update: UpdateRecipeContentProps): void {
    let changed = false

    if (update.name !== undefined) {
      this.props.name = update.name
      changed = true
    }

    if (update.description !== undefined) {
      this.props.description = update.description
      changed = true
    }

    if (update.instructions !== undefined) {
      this.props.instructions = update.instructions
      changed = true
    }

    if (update.prepTimeInMinutes !== undefined) {
      this.props.prepTimeInMinutes = update.prepTimeInMinutes
      changed = true
    }

    if (update.cookTimeInMinutes !== undefined) {
      this.props.cookTimeInMinutes = update.cookTimeInMinutes
      changed = true
    }

    if (update.servings !== undefined) {
      this.props.servings = update.servings
      changed = true
    }

    if (update.difficultyLevel !== undefined) {
      this.props.difficultyLevel = update.difficultyLevel
      changed = true
    }

    if (update.tagsIds !== undefined) {
      this.props.tagsIds = update.tagsIds
      changed = true
    }

    if (update.ingredients !== undefined) {
      this.props.ingredients = update.ingredients
      changed = true
    }

    if (changed) {
      this.touch()
    }
  }

  restoreIngredients(ingredients: RecipeIngredientList): void {
    this.props.ingredients = ingredients
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
      | 'description'
      | 'prepTimeInMinutes'
      | 'cookTimeInMinutes'
      | 'servings'
      | 'difficultyLevel'
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
        description: props.description ?? null,
        prepTimeInMinutes: props.prepTimeInMinutes ?? null,
        cookTimeInMinutes: props.cookTimeInMinutes ?? null,
        servings: props.servings ?? null,
        difficultyLevel: props.difficultyLevel ?? null,
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

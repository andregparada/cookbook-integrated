import { Either, left, right } from '@/core/either'
import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { NormalizedName } from './normalized-name'

export type RecipeTagName = {
  name: string
  normalizedName: NormalizedName
}

export class RecipeTagNames {
  static readonly MAX_TAGS = 10
  static readonly MAX_NAME_LENGTH = 50

  public readonly items: RecipeTagName[]

  private constructor(items: RecipeTagName[]) {
    this.items = items
  }

  static create(
    values: string[],
  ): Either<InvalidRecipeTagsError, RecipeTagNames> {
    const issues: string[] = []
    const seenNormalizedNames = new Set<string>()
    const items: RecipeTagName[] = []

    for (const [index, rawValue] of values.entries()) {
      const name = rawValue.trim()

      if (name.length === 0) {
        issues.push(`tags[${index}]: must not be empty`)
        continue
      }

      if (name.length > RecipeTagNames.MAX_NAME_LENGTH) {
        issues.push(
          `tags[${index}]: must be at most ${RecipeTagNames.MAX_NAME_LENGTH} characters`,
        )
        continue
      }

      const normalizedName = NormalizedName.createFromText(name)

      if (normalizedName.value.length === 0) {
        issues.push(`tags[${index}]: must not be empty`)
        continue
      }

      if (seenNormalizedNames.has(normalizedName.value)) {
        continue
      }

      seenNormalizedNames.add(normalizedName.value)
      items.push({ name, normalizedName })
    }

    if (items.length > RecipeTagNames.MAX_TAGS) {
      issues.push(`must contain at most ${RecipeTagNames.MAX_TAGS} tags`)
    }

    if (issues.length > 0) {
      return left(new InvalidRecipeTagsError(issues))
    }

    return right(new RecipeTagNames(items))
  }
}

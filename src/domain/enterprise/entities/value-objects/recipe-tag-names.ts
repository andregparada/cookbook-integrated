import { Either, left, right } from '@/core/either'
import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { CatalogDisplayName } from './catalog-display-name'
import { NormalizedName } from './normalized-name'

export type RecipeTagName = {
  name: CatalogDisplayName
  normalizedName: NormalizedName
}

export class RecipeTagNames {
  static readonly MAX_TAGS = 10
  static readonly MAX_NAME_LENGTH = CatalogDisplayName.MAX_LENGTH_TAG

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
      const nameResult = CatalogDisplayName.createFromText(rawValue, {
        maxLength: CatalogDisplayName.MAX_LENGTH_TAG,
      })

      if (nameResult.isLeft()) {
        for (const issue of nameResult.value.issues) {
          issues.push(`tags[${index}]: ${issue}`)
        }
        continue
      }

      const name = nameResult.value
      const normalizedName = NormalizedName.createFromText(
        name.normalizationSource,
      )

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

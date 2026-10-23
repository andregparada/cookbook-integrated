import { Either, left, right } from '@/core/either'
import { InvalidCatalogDisplayNameError } from '@/domain/enterprise/errors/invalid-catalog-display-name-error'
import { formatCatalogDisplayName } from '@/domain/utils/format-catalog-display-name'
import { NormalizedName } from './normalized-name'

export type CatalogDisplayNameLimits = {
  maxLength: number
}

export class CatalogDisplayName {
  static readonly MAX_LENGTH_INGREDIENT = 100
  static readonly MAX_LENGTH_TAG = 50

  public readonly value: string
  /** Trimmed input used to derive {@link NormalizedName} (before display formatting). */
  public readonly normalizationSource: string

  private constructor(value: string, normalizationSource: string) {
    this.value = value
    this.normalizationSource = normalizationSource
  }

  static reconstitute(value: string): CatalogDisplayName {
    const trimmed = value.trim()
    return new CatalogDisplayName(value, trimmed)
  }

  static createFromText(
    raw: string,
    { maxLength }: CatalogDisplayNameLimits,
  ): Either<InvalidCatalogDisplayNameError, CatalogDisplayName> {
    const trimmed = raw.trim()

    if (trimmed.length === 0) {
      return left(new InvalidCatalogDisplayNameError(['must not be empty']))
    }

    if (trimmed.length > maxLength) {
      return left(
        new InvalidCatalogDisplayNameError([
          `must be at most ${maxLength} characters`,
        ]),
      )
    }

    const normalizedName = NormalizedName.createFromText(trimmed)

    if (normalizedName.value.length === 0) {
      return left(new InvalidCatalogDisplayNameError(['must not be empty']))
    }

    const formatted = formatCatalogDisplayName(trimmed)

    return right(new CatalogDisplayName(formatted, trimmed))
  }
}

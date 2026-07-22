import { normalizeText } from '@/domain/utils/normalize-text'

/**
 * Canonical key for catalog entities (Tag, Ingredient).
 * Used for deduplication and future query filters (e.g. ?ingredients=ovo).
 */
export class NormalizedName {
  public readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): NormalizedName {
    return new NormalizedName(value)
  }

  static createFromText(text: string): NormalizedName {
    return new NormalizedName(normalizeText(text))
  }
}

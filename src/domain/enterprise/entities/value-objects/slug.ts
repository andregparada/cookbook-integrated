import { normalizeText } from '@/domain/utils/normalize-text'

export class Slug {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Slug {
    return new Slug(value)
  }

  /**
   * Receives a string and normalize it as a slug.
   *
   * Example: "An example title" => "an-example-title"
   *
   * @param text {strring}
   */

  static createFromText(text: string): Slug {
    const slugText = normalizeText(text)

    return new Slug(slugText)
  }
}

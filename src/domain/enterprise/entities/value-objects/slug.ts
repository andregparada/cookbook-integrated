import { normalizeText } from '@/domain/utils/normalize-text'

export class Slug {
  public value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Slug {
    return new Slug(value)
  }

  static createFromText(text: string): Slug {
    const slugText = normalizeText(text)

    return new Slug(slugText)
  }
}

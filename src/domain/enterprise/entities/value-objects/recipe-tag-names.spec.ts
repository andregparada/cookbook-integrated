import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { RecipeTagNames } from './recipe-tag-names'

describe('RecipeTagNames', () => {
  it('should trim tag names', () => {
    const result = RecipeTagNames.create(['  vegetariana  '])

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].name).toBe('vegetariana')
    }
  })

  it('should reject empty tag names', () => {
    const result = RecipeTagNames.create([''])

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })

  it('should reject whitespace-only tag names', () => {
    const result = RecipeTagNames.create(['   '])

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })

  it('should reject tag names that normalize to empty', () => {
    const result = RecipeTagNames.create(['!!!'])

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })

  it('should accept tag names at the maximum length', () => {
    const result = RecipeTagNames.create([
      'a'.repeat(RecipeTagNames.MAX_NAME_LENGTH),
    ])

    expect(result.isRight()).toBe(true)
  })

  it('should reject tag names longer than the maximum length', () => {
    const result = RecipeTagNames.create([
      'a'.repeat(RecipeTagNames.MAX_NAME_LENGTH + 1),
    ])

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })

  it('should deduplicate tags by normalized name keeping the first occurrence', () => {
    const result = RecipeTagNames.create(['Café da Manhã', 'cafe da manha'])

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].name).toBe('Café da Manhã')
      expect(result.value.items[0].normalizedName.value).toBe('cafe-da-manha')
    }
  })

  it('should accept at most the maximum number of tags', () => {
    const tags = Array.from(
      { length: RecipeTagNames.MAX_TAGS },
      (_, index) => `tag-${index}`,
    )

    const result = RecipeTagNames.create(tags)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(RecipeTagNames.MAX_TAGS)
    }
  })

  it('should reject more than the maximum number of tags after deduplication', () => {
    const tags = Array.from(
      { length: RecipeTagNames.MAX_TAGS + 1 },
      (_, index) => `tag-${index}`,
    )

    const result = RecipeTagNames.create(tags)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })
})

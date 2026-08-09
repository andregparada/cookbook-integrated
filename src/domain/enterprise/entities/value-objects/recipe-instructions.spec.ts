import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { RecipeInstructions } from './recipe-instructions'

describe('RecipeInstructions', () => {
  it('should normalize line breaks to line feed', () => {
    const result = RecipeInstructions.create(
      'Bata os ovos.\r\nAdicione a farinha.\rLeve ao forno.',
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.value).toBe(
        'Bata os ovos.\nAdicione a farinha.\nLeve ao forno.',
      )
    }
  })

  it('should trim surrounding whitespace', () => {
    const result = RecipeInstructions.create('\n  Misture tudo.  \n\n')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.value).toBe('Misture tudo.')
    }
  })

  it('should accept instructions at the maximum length', () => {
    const result = RecipeInstructions.create(
      'a'.repeat(RecipeInstructions.MAX_LENGTH),
    )

    expect(result.isRight()).toBe(true)
  })

  it('should reject instructions longer than the maximum length', () => {
    const result = RecipeInstructions.create(
      'a'.repeat(RecipeInstructions.MAX_LENGTH + 1),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeInstructionsError)
  })

  it('should measure length after normalization', () => {
    const result = RecipeInstructions.create(
      `${'a'.repeat(RecipeInstructions.MAX_LENGTH - 2)}\r\nb`,
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.value).toHaveLength(RecipeInstructions.MAX_LENGTH)
    }
  })
})

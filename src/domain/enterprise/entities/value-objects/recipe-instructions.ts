import { Either, left, right } from '@/core/either'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'

/**
 * Free-form recipe instructions (Phase 1). Line breaks are normalized to `\n`
 * so the same content typed on different platforms is stored identically.
 */
export class RecipeInstructions {
  static readonly MAX_LENGTH = 10_000

  public readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(
    value: string,
  ): Either<InvalidRecipeInstructionsError, RecipeInstructions> {
    const normalizedValue = value.replace(/\r\n?/g, '\n').trim()

    if (normalizedValue.length > RecipeInstructions.MAX_LENGTH) {
      return left(
        new InvalidRecipeInstructionsError(
          `Recipe instructions must be at most ${RecipeInstructions.MAX_LENGTH} characters.`,
        ),
      )
    }

    return right(new RecipeInstructions(normalizedValue))
  }
}

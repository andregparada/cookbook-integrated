import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import { DifficultyLevel as PrismaDifficultyLevel } from '@prisma/client'

export function mapDifficultyLevelToDomain(
  level: PrismaDifficultyLevel,
): DifficultyLevel {
  switch (level) {
    case PrismaDifficultyLevel.Easy:
      return DifficultyLevel.EASY
    case PrismaDifficultyLevel.Medium:
      return DifficultyLevel.MEDIUM
    case PrismaDifficultyLevel.Hard:
      return DifficultyLevel.HARD
    default:
      throw new Error(`Invalid difficulty level: ${level}`)
  }
}

export function mapDifficultyLevelToPrisma(
  level: DifficultyLevel,
): PrismaDifficultyLevel {
  switch (level) {
    case DifficultyLevel.EASY:
      return PrismaDifficultyLevel.Easy
    case DifficultyLevel.MEDIUM:
      return PrismaDifficultyLevel.Medium
    case DifficultyLevel.HARD:
      return PrismaDifficultyLevel.Hard
    default:
      throw new Error(`Invalid difficulty level: ${level}`)
  }
}

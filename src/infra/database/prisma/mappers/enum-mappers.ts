import {
  DifficultyLevel,
  RecipeStatus,
} from '@/domain/enterprise/entities/recipe'
import {
  DifficultyLevel as PrismaDifficultyLevel,
  RecipeStatus as PrismaRecipeStatus,
} from '@prisma/client'

export function mapDifficultyLevelToDomain(
  level: PrismaDifficultyLevel | null,
): DifficultyLevel | null {
  switch (level) {
    case PrismaDifficultyLevel.Easy:
      return DifficultyLevel.EASY
    case PrismaDifficultyLevel.Medium:
      return DifficultyLevel.MEDIUM
    case PrismaDifficultyLevel.Hard:
      return DifficultyLevel.HARD
    case null:
      return null
    default:
      throw new Error(`Invalid difficulty level: ${level}`)
  }
}

export function mapDifficultyLevelToPrisma(
  level: DifficultyLevel | null,
): PrismaDifficultyLevel | null {
  switch (level) {
    case DifficultyLevel.EASY:
      return PrismaDifficultyLevel.Easy
    case DifficultyLevel.MEDIUM:
      return PrismaDifficultyLevel.Medium
    case DifficultyLevel.HARD:
      return PrismaDifficultyLevel.Hard
    case null:
      return null
    default:
      throw new Error(`Invalid difficulty level: ${level}`)
  }
}

export function mapRecipeStatusToDomain(
  status: PrismaRecipeStatus,
): RecipeStatus {
  switch (status) {
    case PrismaRecipeStatus.Draft:
      return RecipeStatus.DRAFT
    case PrismaRecipeStatus.Published:
      return RecipeStatus.PUBLISHED
    default:
      throw new Error(`Invalid recipe status: ${status}`)
  }
}

export function mapRecipeStatusToPrisma(
  status: RecipeStatus,
): PrismaRecipeStatus {
  switch (status) {
    case RecipeStatus.DRAFT:
      return PrismaRecipeStatus.Draft
    case RecipeStatus.PUBLISHED:
      return PrismaRecipeStatus.Published
    default:
      throw new Error(`Invalid recipe status: ${status}`)
  }
}

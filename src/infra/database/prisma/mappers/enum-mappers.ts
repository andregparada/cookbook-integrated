import {
  DifficultyLevel,
  RecipeStatus,
} from '@/domain/enterprise/entities/recipe'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import {
  DifficultyLevel as PrismaDifficultyLevel,
  MeasurementUnit as PrismaMeasurementUnit,
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

export function mapMeasurementUnitToDomain(
  unit: PrismaMeasurementUnit,
): MeasurementUnit {
  switch (unit) {
    case PrismaMeasurementUnit.Gram:
      return MeasurementUnit.GRAM
    case PrismaMeasurementUnit.Kilogram:
      return MeasurementUnit.KILOGRAM
    case PrismaMeasurementUnit.Milliliter:
      return MeasurementUnit.MILLILITER
    case PrismaMeasurementUnit.Liter:
      return MeasurementUnit.LITER
    case PrismaMeasurementUnit.Cup:
      return MeasurementUnit.CUP
    case PrismaMeasurementUnit.Tablespoon:
      return MeasurementUnit.TABLESPOON
    case PrismaMeasurementUnit.Teaspoon:
      return MeasurementUnit.TEASPOON
    case PrismaMeasurementUnit.Pinch:
      return MeasurementUnit.PINCH
    case PrismaMeasurementUnit.Dash:
      return MeasurementUnit.DASH
    case PrismaMeasurementUnit.Drop:
      return MeasurementUnit.DROP
    case PrismaMeasurementUnit.Glass:
      return MeasurementUnit.GLASS
    case PrismaMeasurementUnit.Bowl:
      return MeasurementUnit.BOWL
    case PrismaMeasurementUnit.Unit:
      return MeasurementUnit.UNIT
    case PrismaMeasurementUnit.Clove:
      return MeasurementUnit.CLOVE
    case PrismaMeasurementUnit.Slice:
      return MeasurementUnit.SLICE
    case PrismaMeasurementUnit.Piece:
      return MeasurementUnit.PIECE
    case PrismaMeasurementUnit.Bunch:
      return MeasurementUnit.BUNCH
    case PrismaMeasurementUnit.Sprig:
      return MeasurementUnit.SPRIG
    case PrismaMeasurementUnit.Head:
      return MeasurementUnit.HEAD
    case PrismaMeasurementUnit.Stalk:
      return MeasurementUnit.STALK
    case PrismaMeasurementUnit.Can:
      return MeasurementUnit.CAN
    case PrismaMeasurementUnit.Jar:
      return MeasurementUnit.JAR
    case PrismaMeasurementUnit.Bottle:
      return MeasurementUnit.BOTTLE
    case PrismaMeasurementUnit.Box:
      return MeasurementUnit.BOX
    case PrismaMeasurementUnit.Package:
      return MeasurementUnit.PACKAGE
    case PrismaMeasurementUnit.Sachet:
      return MeasurementUnit.SACHET
    case PrismaMeasurementUnit.ToTaste:
      return MeasurementUnit.TO_TASTE
    default:
      throw new Error(`Invalid measurement unit: ${unit}`)
  }
}

export function mapMeasurementUnitToPrisma(
  unit: MeasurementUnit,
): PrismaMeasurementUnit {
  switch (unit) {
    case MeasurementUnit.GRAM:
      return PrismaMeasurementUnit.Gram
    case MeasurementUnit.KILOGRAM:
      return PrismaMeasurementUnit.Kilogram
    case MeasurementUnit.MILLILITER:
      return PrismaMeasurementUnit.Milliliter
    case MeasurementUnit.LITER:
      return PrismaMeasurementUnit.Liter
    case MeasurementUnit.CUP:
      return PrismaMeasurementUnit.Cup
    case MeasurementUnit.TABLESPOON:
      return PrismaMeasurementUnit.Tablespoon
    case MeasurementUnit.TEASPOON:
      return PrismaMeasurementUnit.Teaspoon
    case MeasurementUnit.PINCH:
      return PrismaMeasurementUnit.Pinch
    case MeasurementUnit.DASH:
      return PrismaMeasurementUnit.Dash
    case MeasurementUnit.DROP:
      return PrismaMeasurementUnit.Drop
    case MeasurementUnit.GLASS:
      return PrismaMeasurementUnit.Glass
    case MeasurementUnit.BOWL:
      return PrismaMeasurementUnit.Bowl
    case MeasurementUnit.UNIT:
      return PrismaMeasurementUnit.Unit
    case MeasurementUnit.CLOVE:
      return PrismaMeasurementUnit.Clove
    case MeasurementUnit.SLICE:
      return PrismaMeasurementUnit.Slice
    case MeasurementUnit.PIECE:
      return PrismaMeasurementUnit.Piece
    case MeasurementUnit.BUNCH:
      return PrismaMeasurementUnit.Bunch
    case MeasurementUnit.SPRIG:
      return PrismaMeasurementUnit.Sprig
    case MeasurementUnit.HEAD:
      return PrismaMeasurementUnit.Head
    case MeasurementUnit.STALK:
      return PrismaMeasurementUnit.Stalk
    case MeasurementUnit.CAN:
      return PrismaMeasurementUnit.Can
    case MeasurementUnit.JAR:
      return PrismaMeasurementUnit.Jar
    case MeasurementUnit.BOTTLE:
      return PrismaMeasurementUnit.Bottle
    case MeasurementUnit.BOX:
      return PrismaMeasurementUnit.Box
    case MeasurementUnit.PACKAGE:
      return PrismaMeasurementUnit.Package
    case MeasurementUnit.SACHET:
      return PrismaMeasurementUnit.Sachet
    case MeasurementUnit.TO_TASTE:
      return PrismaMeasurementUnit.ToTaste
    default:
      throw new Error(`Invalid measurement unit: ${unit}`)
  }
}

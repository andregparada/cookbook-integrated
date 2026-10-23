import z from 'zod'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'

export const recipeDifficultyLevelSchema = z.enum(DifficultyLevel).nullish()

export const recipeTagsSchema = z
  .array(z.string().trim().min(1).max(CatalogDisplayName.MAX_LENGTH_TAG))
  .optional()

const recipeIngredientBodySchema = z.object({
  name: z.string().trim().min(1).max(CatalogDisplayName.MAX_LENGTH_INGREDIENT),
  amount: z.number().positive().nullable(),
  unit: z.enum(MeasurementUnit),
  note: z.string().trim().max(200).nullish(),
})

export const createRecipeIngredientBodySchema = recipeIngredientBodySchema

export const editRecipeIngredientBodySchema = recipeIngredientBodySchema.extend(
  {
    id: z.string().uuid().optional(),
  },
)

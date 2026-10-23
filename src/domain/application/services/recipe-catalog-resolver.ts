import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import {
  RecipeIngredient,
  MeasurementUnit,
} from '@/domain/enterprise/entities/recipe-ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'
import { InvalidCatalogDisplayNameError } from '@/domain/enterprise/errors/invalid-catalog-display-name-error'
import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { RecipeTagNames } from '@/domain/enterprise/entities/value-objects/recipe-tag-names'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { TagsRepository } from '../repositories/tags-repository'

export type RecipeIngredientInput = {
  id?: string
  name: string
  amount: number | null
  unit: MeasurementUnit
  note?: string | null
}

@Injectable()
export class RecipeCatalogResolver {
  constructor(
    private tagsRepository: TagsRepository,
    private ingredientsRepository: IngredientsRepository,
  ) {}

  async resolveTagsIds(tagNames: RecipeTagNames): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const { name, normalizedName } of tagNames.items) {
      let tagEntity =
        await this.tagsRepository.findByNormalizedName(normalizedName)

      if (!tagEntity) {
        tagEntity = Tag.create({ name })
        await this.tagsRepository.create(tagEntity)
      }

      tagsIds.push(tagEntity.id)
    }

    return tagsIds
  }

  async resolveRecipeIngredients(
    recipeId: UniqueEntityID,
    recipeIngredients: RecipeIngredientInput[],
  ): Promise<Either<InvalidCatalogDisplayNameError, RecipeIngredient[]>> {
    const issues: string[] = []
    const displayNames = new Map<number, CatalogDisplayName>()

    for (const [index, input] of recipeIngredients.entries()) {
      const nameResult = CatalogDisplayName.createFromText(input.name, {
        maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
      })

      if (nameResult.isLeft()) {
        for (const issue of nameResult.value.issues) {
          issues.push(`recipeIngredients[${index}]: ${issue}`)
        }
        continue
      }

      displayNames.set(index, nameResult.value)
    }

    if (issues.length > 0) {
      return left(new InvalidCatalogDisplayNameError(issues))
    }

    const recipeIngredientEntities: RecipeIngredient[] = []

    for (const [index, input] of recipeIngredients.entries()) {
      const catalogName = displayNames.get(index)!
      const normalizedName = NormalizedName.createFromText(
        catalogName.normalizationSource,
      )

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(normalizedName)

      if (!ingredient) {
        ingredient = Ingredient.create({ name: catalogName })
        await this.ingredientsRepository.create(ingredient)
      }

      const note =
        input.note === undefined || input.note === null
          ? null
          : input.note.trim() === ''
            ? null
            : input.note.trim()

      const recipeIngredient = RecipeIngredient.create(
        {
          recipeId,
          ingredientId: ingredient.id,
          amount: input.amount,
          unit: input.unit,
          position: index,
          note,
        },
        input.id ? new UniqueEntityID(input.id) : undefined,
      )

      recipeIngredientEntities.push(recipeIngredient)
    }

    return right(recipeIngredientEntities)
  }
}

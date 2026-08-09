import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import {
  RecipeIngredient,
  MeasurementUnit,
} from '@/domain/enterprise/entities/recipe-ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
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

  async resolveTagsIds(tags: string[]): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags) {
      const normalizedName = NormalizedName.createFromText(tag)

      let tagEntity =
        await this.tagsRepository.findByNormalizedName(normalizedName)

      if (!tagEntity) {
        tagEntity = Tag.create({ name: tag })
        await this.tagsRepository.create(tagEntity)
      }

      tagsIds.push(tagEntity.id)
    }

    return tagsIds
  }

  async resolveRecipeIngredients(
    recipeId: UniqueEntityID,
    recipeIngredients: RecipeIngredientInput[],
  ): Promise<RecipeIngredient[]> {
    const recipeIngredientEntities: RecipeIngredient[] = []

    for (const [index, input] of recipeIngredients.entries()) {
      const normalizedName = NormalizedName.createFromText(input.name)

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(normalizedName)

      if (!ingredient) {
        ingredient = Ingredient.create({ name: input.name })
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

    return recipeIngredientEntities
  }
}

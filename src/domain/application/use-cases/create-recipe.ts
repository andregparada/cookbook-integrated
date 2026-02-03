import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { normalizeText } from '@/domain/utils/normalize-text'

import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { Tag } from '@/domain/enterprise/entities/tag'

import { RecipesRepository } from '../repositories/recipes-repository'
import { IngredientsRepository } from '../repositories/ingredients-repository'
import { TagsRepository } from '../repositories/tags-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'

interface CreateRecipeUseCaseRequest {
  authorId: string
  name: string
  description: string
  instructions: string
  prepTimeInMinutes: number
  cookTimeInMinutes: number
  servings: number
  difficultyLevel: DifficultyLevel
  tags?: string[]
  recipeIngredients: Array<{
    name: string
    amount: number
    unit: string
  }>
}

type CreateRecipeUseCaseResponse = Either<
  null,
  {
    recipe: Recipe
  }
>

@Injectable()
export class CreateRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private ingredientsRepository: IngredientsRepository,
    private tagsRepository: TagsRepository,
    private recipeIngredientsRepository: RecipeIngredientsRepository,
  ) {}

  async execute({
    authorId,
    name,
    description,
    instructions,
    prepTimeInMinutes,
    cookTimeInMinutes,
    servings,
    difficultyLevel,
    tags = [],
    recipeIngredients = [],
  }: CreateRecipeUseCaseRequest): Promise<CreateRecipeUseCaseResponse> {
    const recipeId = new UniqueEntityID()

    const tagsIds = await this.resolveTagsIds(tags)

    const recipeIngredientEntities = await this.resolveRecipeIngredients(
      recipeId,
      recipeIngredients,
    )

    const recipe = Recipe.create(
      {
        authorId: new UniqueEntityID(authorId),
        name,
        description,
        instructions,
        prepTimeInMinutes,
        cookTimeInMinutes,
        servings,
        difficultyLevel,
        tagsIds,
        recipeIngredientsIds: recipeIngredientEntities.map((ri) => ri.id),
      },
      recipeId,
    )

    await this.recipesRepository.create(recipe)

    for (const recipeIngredient of recipeIngredientEntities) {
      await this.recipeIngredientsRepository.create(recipeIngredient)
    }

    return right({ recipe })
  }

  private async resolveTagsIds(tags: string[]): Promise<UniqueEntityID[]> {
    const tagsIds: UniqueEntityID[] = []

    for (const tag of tags) {
      const normalizedName = normalizeText(tag)

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

  private async resolveRecipeIngredients(
    recipeId: UniqueEntityID,
    recipeIngredients: Array<{
      name: string
      amount: number
      unit: string
    }>,
  ): Promise<RecipeIngredient[]> {
    const recipeIngredientEntities: RecipeIngredient[] = []

    for (const input of recipeIngredients) {
      const normalizedName = normalizeText(input.name)

      let ingredient =
        await this.ingredientsRepository.findByNormalizedName(normalizedName)

      if (!ingredient) {
        ingredient = Ingredient.create({ name: input.name })
        await this.ingredientsRepository.create(ingredient)
      }

      const recipeIngredient = RecipeIngredient.create({
        recipeId,
        ingredientId: ingredient.id,
        amount: input.amount,
        unit: input.unit,
      })

      recipeIngredientEntities.push(recipeIngredient)
    }

    return recipeIngredientEntities
  }
}

// import { DifficultyLevel, Recipe } from '../../enterprise/entities/recipe'
// import { Either, right } from '@/core/either'
// import { Injectable } from '@nestjs/common'
// import { UniqueEntityID } from '@/core/entities/unique-entity-id'
// import { normalizeText } from '@/domain/utils/normalize-text'
// import { TagsRepository } from '../repositories/tags-repository'
// import { Tag } from '@/domain/enterprise/entities/tag'
// import { IngredientsRepository } from '../repositories/ingredients-repository'
// import { Ingredient } from '@/domain/enterprise/entities/ingredient'
// import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
// import { RecipesRepository } from '../repositories/recipes-repository'
// import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

// interface CreateRecipeUseCaseRequest {
//   authorId: string
//   name: string
//   description: string
//   instructions: string
//   prepTimeInMinutes: number
//   cookTimeInMinutes: number
//   servings: number
//   difficultyLevel: DifficultyLevel
//   tags?: string[]
//   recipeIngredients: Array<{
//     name: string
//     amount: number
//     unit: string
//   }>
// }

// type CreateRecipeUseCaseResponse = Either<
//   null,
//   {
//     recipe: Recipe
//   }
// >

// @Injectable()
// export class CreateRecipeUseCase {
//   constructor(
//     private recipesRepository: RecipesRepository,
//     private ingredientsRepository: IngredientsRepository,
//     private tagsRepository: TagsRepository,
//     private recipeIngredientsRepository: RecipeIngredientsRepository,
//   ) {}

//   async execute({
//     authorId,
//     name,
//     description,
//     instructions,
//     prepTimeInMinutes,
//     cookTimeInMinutes,
//     servings,
//     difficultyLevel,
//     tags,
//     recipeIngredients,
//   }: CreateRecipeUseCaseRequest): Promise<CreateRecipeUseCaseResponse> {
//     const recipe = Recipe.create({
//       authorId: new UniqueEntityID(authorId),
//       name,
//       description,
//       instructions,
//       prepTimeInMinutes,
//       cookTimeInMinutes,
//       servings,
//       difficultyLevel,
//     })

//     await this.recipesRepository.create(recipe)

//     const tagsIds = await this.resolveTagsIds(tags)

//     const recipeIngredientsIds = await this.resolveRecipeIngredientsIds(
//       recipe.id,
//       recipeIngredients,
//     )

//     recipe.tagsIds = tagsIds
//     recipe.recipeIngredientsIds = recipeIngredientsIds

//     await this.recipeIngredientsRepository.save(recipe)

//     return right({ recipe })
//   }

//   private async resolveTagsIds(tags: string[] = []): Promise<UniqueEntityID[]> {
//     const tagsIds: UniqueEntityID[] = []

//     for (const tag of tags ?? []) {
//       const normalizedTag = normalizeText(tag)

//       let tagEntity =
//         await this.tagsRepository.findByNormalizedName(normalizedTag)

//       if (!tagEntity) {
//         tagEntity = Tag.create({
//           name: tag,
//         })

//         await this.tagsRepository.create(tagEntity)
//       }

//       tagsIds.push(tagEntity.id)
//     }

//     return tagsIds
//   }

//   private async resolveRecipeIngredientsIds(
//     recipeId: UniqueEntityID,
//     recipeIngredients: Array<{
//       name: string
//       amount: number
//       unit: string
//     }> = [],
//   ): Promise<UniqueEntityID[]> {
//     const recipeIngredientsIds: UniqueEntityID[] = []

//     for (const item of recipeIngredients ?? []) {
//       const normalizedIngredient = normalizeText(item.name)

//       let ingredient =
//         await this.ingredientsRepository.findByNormalizedName(
//           normalizedIngredient,
//         )

//       if (!ingredient) {
//         ingredient = Ingredient.create({
//           name: item.name,
//         })

//         await this.ingredientsRepository.create(ingredient)
//       }

//       const recipeIngredientEntity = RecipeIngredient.create({
//         recipeId,
//         ingredientId: ingredient.id,
//         amount: item.amount,
//         unit: item.unit,
//       })

//       await this.recipeIngredientsRepository.create(recipeIngredientEntity)

//       recipeIngredientsIds.push(recipeIngredientEntity.id)
//     }

//     return recipeIngredientsIds
//   }
// }

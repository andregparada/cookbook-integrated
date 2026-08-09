import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'

import {
  DifficultyLevel,
  Recipe,
  RecipeStatus,
} from '../../enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'

import { RecipesRepository } from '../repositories/recipes-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'

export interface EditRecipeUseCaseRequest {
  recipeId: string
  actorId: string
  name?: string
  description?: string
  instructions?: string
  prepTimeInMinutes?: number
  cookTimeInMinutes?: number
  servings?: number
  difficultyLevel?: DifficultyLevel
  tags: string[]
  recipeIngredients: Array<{
    name: string
    amount: number
    unit: string
  }>
}

type EditRecipeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | RecipeNotPublishableError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class EditRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private recipeIngredientsRepository: RecipeIngredientsRepository,
    private catalogResolver: RecipeCatalogResolver,
  ) {}

  async execute({
    recipeId,
    actorId,
    name,
    description,
    instructions,
    prepTimeInMinutes,
    cookTimeInMinutes,
    servings,
    difficultyLevel,
    tags,
    recipeIngredients,
  }: EditRecipeUseCaseRequest): Promise<EditRecipeUseCaseResponse> {
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    if (actorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    const tagsIds = await this.catalogResolver.resolveTagsIds(tags)

    const currentRecipeIngredients =
      await this.recipeIngredientsRepository.findManyByRecipeId(recipeId)

    const recipeIngredientList = new RecipeIngredientList(
      currentRecipeIngredients,
    )

    const recipeIngredientEntities =
      await this.catalogResolver.resolveRecipeIngredients(
        recipe.id,
        recipeIngredients,
      )

    recipeIngredientList.update(recipeIngredientEntities)

    recipe.ingredients = recipeIngredientList
    recipe.name = name ?? recipe.name
    recipe.description = description ?? recipe.description
    recipe.instructions = instructions ?? recipe.instructions
    recipe.prepTimeInMinutes = prepTimeInMinutes ?? recipe.prepTimeInMinutes
    recipe.cookTimeInMinutes = cookTimeInMinutes ?? recipe.cookTimeInMinutes
    recipe.servings = servings ?? recipe.servings
    recipe.difficultyLevel = difficultyLevel ?? recipe.difficultyLevel
    recipe.tagsIds = tagsIds

    if (recipe.status === RecipeStatus.PUBLISHED) {
      const issues = recipe.getPublishabilityIssues()

      if (issues.length > 0) {
        return left(new RecipeNotPublishableError(issues))
      }
    }

    await this.recipesRepository.save(recipe)

    return right({ recipe })
  }
}

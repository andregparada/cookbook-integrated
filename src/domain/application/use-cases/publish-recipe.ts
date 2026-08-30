import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import { RecipesRepository } from '../repositories/recipes-repository'
import { RecipeIngredientsRepository } from '../repositories/recipe-ingredients-repository'

export interface PublishRecipeUseCaseRequest {
  recipeId: string
  actorId: string
}

type PublishRecipeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError | RecipeNotPublishableError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class PublishRecipeUseCase {
  constructor(
    private recipesRepository: RecipesRepository,
    private recipeIngredientsRepository: RecipeIngredientsRepository,
  ) {}

  async execute({
    recipeId,
    actorId,
  }: PublishRecipeUseCaseRequest): Promise<PublishRecipeUseCaseResponse> {
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    if (actorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    const recipeIngredients =
      await this.recipeIngredientsRepository.findManyByRecipeId(recipeId)

    recipe.restoreIngredients(new RecipeIngredientList(recipeIngredients))

    // TODO: mudar para padrão left/right
    try {
      recipe.publish()
    } catch (error) {
      if (error instanceof RecipeNotPublishableError) {
        return left(error)
      }

      throw error
    }

    await this.recipesRepository.save(recipe)

    return right({ recipe })
  }
}

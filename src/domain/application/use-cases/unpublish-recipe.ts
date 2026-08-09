import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipesRepository } from '../repositories/recipes-repository'

export interface UnpublishRecipeUseCaseRequest {
  recipeId: string
  actorId: string
}

type UnpublishRecipeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class UnpublishRecipeUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute({
    recipeId,
    actorId,
  }: UnpublishRecipeUseCaseRequest): Promise<UnpublishRecipeUseCaseResponse> {
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    if (actorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    recipe.unpublish()

    await this.recipesRepository.save(recipe)

    return right({ recipe })
  }
}

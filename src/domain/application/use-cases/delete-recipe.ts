import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipesRepository } from '../repositories/recipes-repository'

export interface DeleteRecipeUseCaseRequest {
  recipeId: string
  actorId: string
}

type DeleteRecipeUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    recipe: Recipe
  }
>

@Injectable()
export class DeleteRecipeUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute({
    recipeId,
    actorId,
  }: DeleteRecipeUseCaseRequest): Promise<DeleteRecipeUseCaseResponse> {
    const recipe = await this.recipesRepository.findById(recipeId)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    if (actorId !== recipe.authorId.toString()) {
      return left(new NotAllowedError())
    }

    recipe.softDelete()

    await this.recipesRepository.save(recipe)

    return right({ recipe })
  }
}

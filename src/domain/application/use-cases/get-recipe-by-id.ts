import { Either, left, right } from '@/core/either'
import { RecipesRepository } from '../repositories/recipes-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

interface GetRecipeByIdUseCaseRequest {
  id: string
}

type GetRecipeByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    recipe: RecipeDetails
  }
>

@Injectable()
export class GetRecipeByIdUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute({
    id,
  }: GetRecipeByIdUseCaseRequest): Promise<GetRecipeByIdUseCaseResponse> {
    const recipe = await this.recipesRepository.findDetailsById(id)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    return right({
      recipe,
    })
  }
}

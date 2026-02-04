import { Either, left, right } from '@/core/either'
import { RecipesRepository } from '../repositories/recipes-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Injectable } from '@nestjs/common'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

interface GetRecipeBySlugUseCaseRequest {
  slug: string
}

type GetRecipeBySlugUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    recipe: RecipeDetails
  }
>

@Injectable()
export class GetRecipeBySlugUseCase {
  constructor(private recipesRepository: RecipesRepository) {}

  async execute({
    slug,
  }: GetRecipeBySlugUseCaseRequest): Promise<GetRecipeBySlugUseCaseResponse> {
    const recipe = await this.recipesRepository.findDetailsBySlug(slug)

    if (!recipe) {
      return left(new ResourceNotFoundError())
    }

    return right({
      recipe,
    })
  }
}

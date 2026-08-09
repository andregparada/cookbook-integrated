import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import {
  makeRecipe,
  makeUnpublishRecipeUseCaseRequest,
} from 'test/factories/make-recipe'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { UnpublishRecipeUseCase } from './unpublish-recipe'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: UnpublishRecipeUseCase

describe('Unpublish Recipe', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
    inMemoryRecipesRepository = new InMemoryRecipesRepository(
      inMemoryChefsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
    )
    sut = new UnpublishRecipeUseCase(inMemoryRecipesRepository)
  })

  it('should be able to unpublish a recipe', async () => {
    const publishedAt = new Date('2024-01-01T00:00:00.000Z')
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.PUBLISHED,
        publishedAt,
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeUnpublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].status).toBe(RecipeStatus.DRAFT)
    expect(inMemoryRecipesRepository.items[0].publishedAt).toEqual(publishedAt)
  })

  it('should not be able to unpublish a recipe from another chef', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeUnpublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-2',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to unpublish a non-existing recipe', async () => {
    const result = await sut.execute(
      makeUnpublishRecipeUseCaseRequest({
        recipeId: 'non-existing-recipe-id',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { makeRecipe } from 'test/factories/make-recipe'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeChef } from 'test/factories/make-chef'
import { GetRecipeByIdUseCase } from './get-recipe-by-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: GetRecipeByIdUseCase

describe('Get Recipe By Id', () => {
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
    sut = new GetRecipeByIdUseCase(inMemoryRecipesRepository)
  })

  it('should be able to get a recipe by id', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
    })

    inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      recipe: expect.objectContaining({
        name: newRecipe.name,
        author: 'John_Doe',
        slug: newRecipe.slug,
      }),
    })
  })

  it('should return ResourceNotFoundError when recipe does not exist', async () => {
    const result = await sut.execute({
      id: 'non-existent-recipe-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

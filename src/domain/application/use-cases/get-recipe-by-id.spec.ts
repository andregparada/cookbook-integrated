import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { makeRecipe } from 'test/factories/make-recipe'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeChef } from 'test/factories/make-chef'
import { GetRecipeByIdUseCase } from './get-recipe-by-id'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'

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
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(newRecipe)

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

  // TODO: fundir com “should be able to get a recipe by id” — o primeiro já executa sem actorId.
  it('should be able to get a published recipe without actorId', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should return ResourceNotFoundError when draft is requested by non-author', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      status: RecipeStatus.DRAFT,
    })

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
      actorId: 'another-user-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to get a draft recipe by its author', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      status: RecipeStatus.DRAFT,
    })

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
      actorId: chef.id.toString(),
    })

    expect(result.isRight()).toBe(true)
  })

  it('should return ResourceNotFoundError when soft-deleted recipe is requested by author', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(newRecipe)

    newRecipe.softDelete()
    await inMemoryRecipesRepository.save(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
      actorId: chef.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should return ResourceNotFoundError when soft-deleted recipe is requested without actorId', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(newRecipe)

    newRecipe.softDelete()
    await inMemoryRecipesRepository.save(newRecipe)

    const result = await sut.execute({
      id: newRecipe.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { makeRecipe } from 'test/factories/make-recipe'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeChef } from 'test/factories/make-chef'
import { SearchRecipesUseCase } from './search-recipes'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { RecipeSearchScope } from '../repositories/recipes-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { DEFAULT_PER_PAGE } from '@/core/repositories/pagination-params'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: SearchRecipesUseCase

describe('Search Recipes', () => {
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
    sut = new SearchRecipesUseCase(inMemoryRecipesRepository)
  })

  it('should return only published recipes from all chefs in global scope', async () => {
    const authorA = makeChef({ userName: 'author_a' })
    const authorB = makeChef({ userName: 'author_b' })

    inMemoryChefsRepository.items.push(authorA, authorB)

    const publishedRecipe = makeRecipe({
      authorId: authorA.id,
      name: 'Published Recipe',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const draftRecipe = makeRecipe({
      authorId: authorB.id,
      name: 'Draft Recipe',
      status: RecipeStatus.DRAFT,
    })

    await inMemoryRecipesRepository.create(publishedRecipe)
    await inMemoryRecipesRepository.create(draftRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Published Recipe')
      expect(result.value.result.meta.totalItems).toBe(1)
    }
  })

  it('should hide draft recipes in global scope even when requester is the author', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const draftRecipe = makeRecipe({
      authorId: author.id,
      name: 'My Draft',
      status: RecipeStatus.DRAFT,
    })

    await inMemoryRecipesRepository.create(draftRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      actorId: author.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(0)
      expect(result.value.result.meta.totalItems).toBe(0)
    }
  })

  it('should hide soft-deleted recipes in global scope', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(recipe)

    recipe.softDelete()
    await inMemoryRecipesRepository.save(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(0)
    }
  })

  it('should hide soft-deleted recipes in mine scope', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      status: RecipeStatus.DRAFT,
    })

    await inMemoryRecipesRepository.create(recipe)

    recipe.softDelete()
    await inMemoryRecipesRepository.save(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.MINE,
      actorId: author.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(0)
    }
  })

  it('should return own draft and published recipes in mine scope', async () => {
    const author = makeChef({ userName: 'author' })
    const otherChef = makeChef({ userName: 'other' })

    inMemoryChefsRepository.items.push(author, otherChef)

    const draftRecipe = makeRecipe({
      authorId: author.id,
      name: 'My Draft',
      status: RecipeStatus.DRAFT,
    })

    const publishedRecipe = makeRecipe({
      authorId: author.id,
      name: 'My Published',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    const otherRecipe = makeRecipe({
      authorId: otherChef.id,
      name: 'Other Published',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(draftRecipe)
    await inMemoryRecipesRepository.create(publishedRecipe)
    await inMemoryRecipesRepository.create(otherRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.MINE,
      actorId: author.id.toString(),
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(2)
      expect(result.value.result.items.map((item) => item.name)).toEqual(
        expect.arrayContaining(['My Draft', 'My Published']),
      )
      expect(result.value.result.meta.totalItems).toBe(2)
    }
  })

  it('should return NotAllowedError when mine scope is requested without actorId', async () => {
    const result = await sut.execute({
      scope: RecipeSearchScope.MINE,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should paginate results with correct meta defaults', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    for (let index = 0; index < 3; index++) {
      const recipe = makeRecipe({
        authorId: author.id,
        name: `Recipe ${index}`,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - index * 1000),
      })

      await inMemoryRecipesRepository.create(recipe)
    }

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      page: 1,
      perPage: 2,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(2)
      expect(result.value.result.meta).toEqual({
        page: 1,
        perPage: 2,
        totalItems: 3,
        totalPages: 2,
      })
    }
  })

  it('should use default page and perPage when omitted', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.meta.page).toBe(1)
      expect(result.value.result.meta.perPage).toBe(DEFAULT_PER_PAGE)
    }
  })
})

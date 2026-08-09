import { CreateRecipeUseCase } from './create-recipe'
import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { Tag } from '@/domain/enterprise/entities/tag'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { makeCreateRecipeUseCaseRequest } from 'test/factories/make-recipe'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let catalogResolver: RecipeCatalogResolver
let sut: CreateRecipeUseCase

describe('Create Recipe', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
    inMemoryRecipesRepository = new InMemoryRecipesRepository(
      inMemoryChefsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
    )
    catalogResolver = new RecipeCatalogResolver(
      inMemoryTagsRepository,
      inMemoryIngredientsRepository,
    )
    sut = new CreateRecipeUseCase(inMemoryRecipesRepository, catalogResolver)
  })

  it('should be able to create a recipe', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({ tags: ['tag1', 'tag2'] }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.ingredients.getItems()).toHaveLength(2)
      expect(result.value.recipe.status).toBe(RecipeStatus.DRAFT)
      expect(result.value.recipe.publishedAt).toBeNull()
    }

    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(2)
  })

  it('should reuse an existing tag when only casing differs', async () => {
    await inMemoryTagsRepository.create(Tag.create({ name: 'Ovo' }))

    await sut.execute(makeCreateRecipeUseCaseRequest({ tags: ['ovo'] }))

    expect(inMemoryTagsRepository.items).toHaveLength(1)
    expect(inMemoryTagsRepository.items[0].name).toBe('Ovo')
  })

  it('should reuse an existing ingredient when only casing differs', async () => {
    await inMemoryIngredientsRepository.create(
      Ingredient.create({ name: 'Tomate' }),
    )

    await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [{ name: 'tomate', amount: 3, unit: 'unidade' }],
      }),
    )

    expect(inMemoryIngredientsRepository.items).toHaveLength(1)
    expect(inMemoryIngredientsRepository.items[0].name).toBe('Tomate')
  })

  it('should be able to create an incomplete draft recipe', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        name: '',
        description: null,
        instructions: '',
        recipeIngredients: [],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.status).toBe(RecipeStatus.DRAFT)
      expect(result.value.recipe.name).toBe('')
      expect(result.value.recipe.instructions).toBe('')
      expect(result.value.recipe.description).toBeNull()
      expect(result.value.recipe.ingredients.getItems()).toHaveLength(0)
    }
  })

  it('should default timing and servings to null when omitted', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        prepTimeInMinutes: undefined,
        cookTimeInMinutes: undefined,
        servings: undefined,
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.prepTimeInMinutes).toBeNull()
      expect(result.value.recipe.cookTimeInMinutes).toBeNull()
      expect(result.value.recipe.servings).toBeNull()
    }
  })

  it('should preserve explicit zero cook time as a valid value', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        prepTimeInMinutes: undefined,
        cookTimeInMinutes: 0,
        servings: undefined,
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.cookTimeInMinutes).toBe(0)
      expect(result.value.recipe.prepTimeInMinutes).toBeNull()
    }
  })

  it('should not allow zero servings', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        servings: 0,
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTimingOrServingsError)
  })
})

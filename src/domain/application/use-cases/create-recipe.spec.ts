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
    expect(result.value?.recipe.ingredients.getItems()).toHaveLength(2)
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(2)
    expect(result.value?.recipe.status).toBe(RecipeStatus.DRAFT)
    expect(result.value?.recipe.publishedAt).toBeNull()
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
})

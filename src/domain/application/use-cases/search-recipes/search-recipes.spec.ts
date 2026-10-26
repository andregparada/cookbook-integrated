import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import {
  makeRecipe,
  makeRecipeWithIngredients,
} from 'test/factories/make-recipe'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeChef } from 'test/factories/make-chef'
import { SearchRecipesUseCase } from './search-recipes'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { RecipeSearchScope } from '../../repositories/recipes-repository'
import { UnauthenticatedError } from '@/core/errors/errors/unauthenticated-error'
import { DEFAULT_PER_PAGE } from '@/core/repositories/pagination-params'
import {
  IngredientMatchMode,
  RecipeListReadModel,
} from './search-recipes-params'
import { RecipeCatalogCard } from '@/domain/enterprise/entities/value-objects/recipe-catalog-card'
import { RecipeAuthorWorkspaceItem } from '@/domain/enterprise/entities/value-objects/recipe-author-workspace-item'
import { RecipeSearchResultItem } from '@/domain/enterprise/entities/value-objects/recipe-search-result-item'
import { SearchIngredientTermsResolver } from '../../services/search-ingredient-terms-resolver'
import { makeIngredient } from 'test/factories/make-ingredient'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: SearchRecipesUseCase

async function seedIngredient(name: string, id?: UniqueEntityID) {
  const ingredient = makeIngredient({ name }, id)

  await inMemoryIngredientsRepository.create(ingredient)

  return ingredient
}

describe('Search Recipes', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    inMemoryRecipesRepository = new InMemoryRecipesRepository(
      inMemoryChefsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
    )
    const searchIngredientTermsResolver = new SearchIngredientTermsResolver(
      inMemoryIngredientsRepository,
    )
    sut = new SearchRecipesUseCase(
      inMemoryRecipesRepository,
      searchIngredientTermsResolver,
    )
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
    })

    await inMemoryRecipesRepository.create(publishedRecipe)
    await inMemoryRecipesRepository.create(draftRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.listReadModel).toBe(RecipeListReadModel.CATALOG_CARD)
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0]).toBeInstanceOf(RecipeCatalogCard)
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
      expect(result.value.listReadModel).toBe(
        RecipeListReadModel.AUTHOR_WORKSPACE_ITEM,
      )
      expect(result.value.result.items).toHaveLength(2)
      expect(result.value.result.items[0]).toBeInstanceOf(
        RecipeAuthorWorkspaceItem,
      )
      expect(result.value.result.items.map((item) => item.name)).toEqual(
        expect.arrayContaining(['My Draft', 'My Published']),
      )
      expect(result.value.result.meta.totalItems).toBe(2)
    }
  })

  it('should return UnauthenticatedError when mine scope is requested without actorId', async () => {
    const result = await sut.execute({
      scope: RecipeSearchScope.MINE,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnauthenticatedError)
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

  it('should filter recipes by query matching name case-insensitively', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      name: 'Bolo de Cenoura',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      query: 'BOLO',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.listReadModel).toBe(
        RecipeListReadModel.SEARCH_RESULT_ITEM,
      )
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0]).toBeInstanceOf(
        RecipeSearchResultItem,
      )
      expect(result.value.result.items[0].name).toBe('Bolo de Cenoura')
    }
  })

  it('should filter recipes by query matching description', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      name: 'Receita Especial',
      description: 'Delicioso bolo de cenoura com cobertura',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      query: 'cenoura',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Receita Especial')
    }
  })

  it('should not match query against instructions', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const recipe = makeRecipe({
      authorId: author.id,
      name: 'Receita Sem Match',
      description: 'Um prato simples',
      instructions: 'Adicione chocolate ao preparo',
      status: RecipeStatus.PUBLISHED,
      publishedAt: new Date(),
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      query: 'chocolate',
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(0)
      expect(result.value.result.meta.totalItems).toBe(0)
    }
  })

  it('should treat empty ingredients list as no catalog filter', async () => {
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
      ingredients: [],
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.listReadModel).toBe(RecipeListReadModel.CATALOG_CARD)
    }
  })

  it('should return recipes that contain all required ingredients by default', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const potato = await seedIngredient('Batata')
    const onion = await seedIngredient('Cebola')

    const matchingRecipe = makeRecipeWithIngredients(
      author.id,
      [chicken.id, potato.id],
      { name: 'Chicken Potato Stew' },
    )

    const partialRecipe = makeRecipeWithIngredients(author.id, [chicken.id], {
      name: 'Chicken Only',
    })

    const otherRecipe = makeRecipeWithIngredients(author.id, [onion.id], {
      name: 'Onion Soup',
    })

    await inMemoryRecipesRepository.create(matchingRecipe)
    await inMemoryRecipesRepository.create(partialRecipe)
    await inMemoryRecipesRepository.create(otherRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: ['frango', 'batata'],
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Chicken Potato Stew')
    }
  })

  it('should return recipes that contain any required ingredient when ingredientMatch is ANY', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const potato = await seedIngredient('Batata')

    const chickenRecipe = makeRecipeWithIngredients(author.id, [chicken.id], {
      name: 'Chicken Dish',
    })

    const potatoRecipe = makeRecipeWithIngredients(author.id, [potato.id], {
      name: 'Potato Dish',
    })

    await inMemoryRecipesRepository.create(chickenRecipe)
    await inMemoryRecipesRepository.create(potatoRecipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: ['frango', 'batata'],
      ingredientMatch: IngredientMatchMode.ANY,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(2)
      expect(result.value.result.items.map((item) => item.name)).toEqual(
        expect.arrayContaining(['Chicken Dish', 'Potato Dish']),
      )
    }
  })

  it('should return empty results when unknown ingredient is required in ALL mode', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const recipe = makeRecipeWithIngredients(author.id, [chicken.id])

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: ['frango', 'unknown-ingredient'],
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(0)
      expect(result.value.result.meta.totalItems).toBe(0)
    }
  })

  it('should ignore unknown ingredients in ANY mode when at least one term resolves', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const recipe = makeRecipeWithIngredients(author.id, [chicken.id], {
      name: 'Chicken Dish',
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: ['frango', 'unknown-ingredient'],
      ingredientMatch: IngredientMatchMode.ANY,
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Chicken Dish')
    }
  })

  it('should deduplicate repeated ingredient terms without affecting ALL mode', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const recipe = makeRecipeWithIngredients(author.id, [chicken.id], {
      name: 'Chicken Dish',
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: ['Frango', 'frango', 'FRANGO'],
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Chicken Dish')
    }
  })

  it('should filter ingredients by catalog id', async () => {
    const author = makeChef({ userName: 'author' })

    inMemoryChefsRepository.items.push(author)

    const chicken = await seedIngredient('Frango')
    const recipe = makeRecipeWithIngredients(author.id, [chicken.id], {
      name: 'Chicken Dish',
    })

    await inMemoryRecipesRepository.create(recipe)

    const result = await sut.execute({
      scope: RecipeSearchScope.GLOBAL,
      ingredients: [chicken.id.toString()],
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.result.items).toHaveLength(1)
      expect(result.value.result.items[0].name).toBe('Chicken Dish')
    }
  })
})

import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import {
  makePublishRecipeUseCaseRequest,
  makeRecipe,
} from 'test/factories/make-recipe'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import {
  RecipeIngredient,
  MeasurementUnit,
} from '@/domain/enterprise/entities/recipe-ingredient'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { PublishRecipeUseCase } from './publish-recipe'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: PublishRecipeUseCase

describe('Publish Recipe', () => {
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
    sut = new PublishRecipeUseCase(
      inMemoryRecipesRepository,
      inMemoryRecipeIngredientsRepository,
    )
  })

  it('should be able to publish a recipe', async () => {
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
      position: 0,
      note: null,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)
    await inMemoryRecipeIngredientsRepository.createMany([recipeIngredient])

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].status).toBe(
      RecipeStatus.PUBLISHED,
    )
    expect(inMemoryRecipesRepository.items[0].publishedAt).toBeInstanceOf(Date)
  })

  it('should keep publishedAt when republishing after unpublish', async () => {
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
      position: 0,
      note: null,
    })

    const publishedAt = new Date('2024-01-01T00:00:00.000Z')
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.DRAFT,
        publishedAt,
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].publishedAt).toEqual(publishedAt)
  })

  it('should load ingredients from repository before validating publishability', async () => {
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
      position: 0,
      note: null,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        ingredients: new RecipeIngredientList(),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)
    await inMemoryRecipeIngredientsRepository.createMany([recipeIngredient])

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].status).toBe(
      RecipeStatus.PUBLISHED,
    )
  })

  it('should not be able to publish an incomplete recipe', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        name: '',
        ingredients: new RecipeIngredientList(),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipeNotPublishableError)
    expect((result.value as RecipeNotPublishableError).message).toContain(
      'name',
    )
    expect((result.value as RecipeNotPublishableError).message).toContain(
      'ingredients',
    )
    expect(inMemoryRecipesRepository.items[0].status).toBe(RecipeStatus.DRAFT)
  })

  it('should not be able to publish a recipe with empty instructions', async () => {
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
      position: 0,
      note: null,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        instructions: '',
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipeNotPublishableError)
    expect((result.value as RecipeNotPublishableError).message).toContain(
      'instructions',
    )
    expect(inMemoryRecipesRepository.items[0].status).toBe(RecipeStatus.DRAFT)
  })

  it('should not be able to publish a recipe from another chef', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-2',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to publish a non-existing recipe', async () => {
    const result = await sut.execute(
      makePublishRecipeUseCaseRequest({
        recipeId: 'non-existing-recipe-id',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

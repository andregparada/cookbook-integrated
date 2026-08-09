import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { EditRecipeUseCase } from './edit-recipe'
import {
  makeEditRecipeUseCaseRequest,
  makeRecipe,
} from 'test/factories/make-recipe'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Tag } from '@/domain/enterprise/entities/tag'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import {
  RecipeIngredient,
  MeasurementUnit,
} from '@/domain/enterprise/entities/recipe-ingredient'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'
import { RecipeNotPublishableError } from '@/domain/enterprise/errors/recipe-not-publishable-error'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let catalogResolver: RecipeCatalogResolver
let sut: EditRecipeUseCase

describe('Edit Recipe', () => {
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
    sut = new EditRecipeUseCase(
      inMemoryRecipesRepository,
      inMemoryRecipeIngredientsRepository,
      catalogResolver,
    )
  })

  it('should be able to edit a recipe', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: 'New Name',
        description: 'New Description',
        instructions: 'New Instructions',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'New Name',
      description: 'New Description',
      instructions: 'New Instructions',
    })
    expect(inMemoryRecipesRepository.items[0].tagsIds).toHaveLength(2)
    expect(inMemoryTagsRepository.items).toHaveLength(2)
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(2)
  })

  it('should keep slug stable when recipe name is changed', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        name: 'Bolo de Cenoura',
      },
      new UniqueEntityID('recipe-1'),
    )

    const originalSlug = newRecipe.slug.value

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: 'Bolo de Chocolate',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].slug.value).toBe(originalSlug)
    expect(inMemoryRecipesRepository.items[0].name).toBe('Bolo de Chocolate')
  })

  it('should clear tags and recipe ingredients when empty arrays are sent', async () => {
    const tag1 = Tag.create({ name: 'tag1' })
    const tag2 = Tag.create({ name: 'tag2' })
    await inMemoryTagsRepository.create(tag1)
    await inMemoryTagsRepository.create(tag2)

    const ingredient = Ingredient.create({ name: 'flour' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 2,
      unit: MeasurementUnit.CUP,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        tagsIds: [tag1.id, tag2.id],
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        tags: [],
        recipeIngredients: [],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].tagsIds).toHaveLength(0)
    expect(
      inMemoryRecipesRepository.items[0].ingredients.getItems(),
    ).toHaveLength(0)
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(0)
  })

  it('should update amount and unit for the same ingredient without duplicating rows', async () => {
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        tags: [],
        recipeIngredients: [
          { name: 'Salt', amount: 2, unit: MeasurementUnit.TABLESPOON },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(
      inMemoryRecipesRepository.items[0].ingredients.getItems(),
    ).toHaveLength(1)
    expect(
      inMemoryRecipesRepository.items[0].ingredients.getItems()[0],
    ).toMatchObject({
      amount: 2,
      unit: MeasurementUnit.TABLESPOON,
    })
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(1)
    expect(inMemoryRecipeIngredientsRepository.items[0]).toMatchObject({
      amount: 2,
      unit: MeasurementUnit.TABLESPOON,
    })
  })

  it('should preserve scalar fields when they are omitted from the request', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        name: 'Original Name',
        description: 'Original Description',
        prepTimeInMinutes: 10,
        cookTimeInMinutes: 20,
        servings: 4,
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: 'New Name',
        description: undefined,
        prepTimeInMinutes: undefined,
        cookTimeInMinutes: undefined,
        servings: undefined,
        tags: ['dinner'],
        recipeIngredients: [
          { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'New Name',
      description: 'Original Description',
      prepTimeInMinutes: 10,
      cookTimeInMinutes: 20,
      servings: 4,
    })
    expect(inMemoryRecipesRepository.items[0].tagsIds).toHaveLength(1)
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(1)
  })

  it('should clear timing when null is sent explicitly', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        prepTimeInMinutes: 10,
        cookTimeInMinutes: 20,
        servings: 4,
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        prepTimeInMinutes: null,
        cookTimeInMinutes: undefined,
        servings: undefined,
        tags: ['dinner'],
        recipeIngredients: [
          { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].prepTimeInMinutes).toBeNull()
    expect(inMemoryRecipesRepository.items[0].cookTimeInMinutes).toBe(20)
    expect(inMemoryRecipesRepository.items[0].servings).toBe(4)
  })

  it('should not allow negative prep time', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        prepTimeInMinutes: -1,
        tags: ['dinner'],
        recipeIngredients: [
          { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
        ],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTimingOrServingsError)
  })

  it('should preserve authorId after a successful edit', async () => {
    const authorId = new UniqueEntityID('author-1')
    const newRecipe = makeRecipe(
      {
        authorId,
        name: 'Original Name',
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: 'New Name',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].authorId).toEqual(authorId)
    expect(inMemoryRecipesRepository.items[0].authorId.toString()).toBe(
      'author-1',
    )
  })

  it('should not be able to edit a recipe from another chef', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        name: 'Original Name',
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-2',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'Original Name',
    })
  })

  it('should not be able to edit a non-existing recipe', async () => {
    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: 'non-existing-recipe-id',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to remove all ingredients from a published recipe', async () => {
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        tags: [],
        recipeIngredients: [],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipeNotPublishableError)
  })

  it('should not be able to clear name from a published recipe', async () => {
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: '',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipeNotPublishableError)
    expect(inMemoryRecipesRepository.items[0].status).toBe(
      RecipeStatus.PUBLISHED,
    )
  })

  it('should not be able to clear instructions from a published recipe', async () => {
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        instructions: '',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RecipeNotPublishableError)
    expect(inMemoryRecipesRepository.items[0].status).toBe(
      RecipeStatus.PUBLISHED,
    )
  })

  it('should not allow invalid ingredient measurement', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        recipeIngredients: [
          { name: 'Salt', amount: 2, unit: MeasurementUnit.TO_TASTE },
        ],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeIngredientMeasurementError)
  })
})

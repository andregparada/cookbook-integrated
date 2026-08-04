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
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'

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
        authorId: 'author-1',
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
      unit: 'cups',
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
        authorId: 'author-1',
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
      unit: 'tsp',
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
        authorId: 'author-1',
        tags: [],
        recipeIngredients: [{ name: 'Salt', amount: 2, unit: 'tbsp' }],
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
      unit: 'tbsp',
    })
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(1)
    expect(inMemoryRecipeIngredientsRepository.items[0]).toMatchObject({
      amount: 2,
      unit: 'tbsp',
    })
  })

  it('should preserve scalar fields when they are omitted from the request', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        name: 'Original Name',
        description: 'Original Description',
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        authorId: 'author-1',
        name: 'New Name',
        description: undefined,
        tags: ['dinner'],
        recipeIngredients: [{ name: 'Salt', amount: 1, unit: 'tsp' }],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'New Name',
      description: 'Original Description',
    })
    expect(inMemoryRecipesRepository.items[0].tagsIds).toHaveLength(1)
    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(1)
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
        authorId: 'author-2',
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
        authorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

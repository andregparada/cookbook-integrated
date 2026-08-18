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
import { UnknownRecipeIngredientError } from '@/domain/enterprise/errors/unknown-recipe-ingredient-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { RecipeInstructions } from '@/domain/enterprise/entities/value-objects/recipe-instructions'
import { RecipeTagNames } from '@/domain/enterprise/entities/value-objects/recipe-tag-names'
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
    // TODO: usar factory
    const tag1 = Tag.create({ name: 'tag1' })
    const tag2 = Tag.create({ name: 'tag2' })
    await inMemoryTagsRepository.create(tag1)
    await inMemoryTagsRepository.create(tag2)

    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'flour' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
      amount: 2,
      unit: MeasurementUnit.CUP,
      position: 0,
      note: null,
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

  it('should preserve tags when they are omitted from the request', async () => {
    // TODO: usar factory
    const tag1 = Tag.create({ name: 'tag1' })
    const tag2 = Tag.create({ name: 'tag2' })
    await inMemoryTagsRepository.create(tag1)
    await inMemoryTagsRepository.create(tag2)

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        tagsIds: [tag1.id, tag2.id],
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        name: 'Updated Name',
        tags: undefined,
        recipeIngredients: [
          { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].tagsIds).toHaveLength(2)
    expect(inMemoryRecipesRepository.items[0].tagsIds).toEqual([
      tag1.id,
      tag2.id,
    ])
    expect(inMemoryRecipesRepository.items[0].name).toBe('Updated Name')
  })

  // TODO: limite MAX_TAGS já está em recipe-tag-names.spec.ts.
  // Manter só InvalidRecipeTagsError.
  it('should not allow more than the maximum number of tags', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const tags = Array.from(
      { length: RecipeTagNames.MAX_TAGS + 1 },
      (_, index) => `tag-${index}`,
    )

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        tags,
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
  })

  it('should update amount and unit for the same ingredient without duplicating rows', async () => {
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

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

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        tags: [],
        recipeIngredients: [
          {
            id: recipeIngredient.id.toString(),
            name: 'Salt',
            amount: 2,
            unit: MeasurementUnit.TABLESPOON,
          },
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
    expect(inMemoryRecipeIngredientsRepository.items[0].id).toEqual(
      recipeIngredient.id,
    )
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

  it('should clear description when null is sent explicitly', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        description: 'Original Description',
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        description: null,
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].description).toBeNull()
  })

  // TODO: tirar a asserção da string normalizada — já está em recipe-instructions.spec.ts.
  // No use case basta isRight (o execute aplica o VO).
  it('should normalize instructions line breaks', async () => {
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
        instructions: '  Bata os ovos.\r\nLeve ao forno.  ',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].instructions).toBe(
      'Bata os ovos.\nLeve ao forno.',
    )
  })

  // TODO: limite de tamanho já está em recipe-instructions.spec.ts.
  // Manter só InvalidRecipeInstructionsError + instructions inalteradas.
  it('should not allow instructions longer than the maximum length', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        instructions: 'Original Instructions',
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeEditRecipeUseCaseRequest({
        recipeId: newRecipe.id.toValue(),
        actorId: 'author-1',
        instructions: 'a'.repeat(RecipeInstructions.MAX_LENGTH + 1),
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeInstructionsError)
    expect(inMemoryRecipesRepository.items[0].instructions).toBe(
      'Original Instructions',
    )
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
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

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
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

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
    // TODO: usar factory
    const ingredient = Ingredient.create({ name: 'Salt' })
    await inMemoryIngredientsRepository.create(ingredient)

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

  it('should not allow ingredients with "to taste" measurement with amount', async () => {
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

  it('should reject unknown recipe ingredient ids', async () => {
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
          {
            id: 'unknown-ingredient-id',
            name: 'Salt',
            amount: 1,
            unit: MeasurementUnit.TEASPOON,
          },
        ],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnknownRecipeIngredientError)
  })

  it('should update position when recipe ingredients are reordered', async () => {
    // TODO: usar factory
    const ingredientA = Ingredient.create({ name: 'Salt' })
    const ingredientB = Ingredient.create({ name: 'Pepper' })
    await inMemoryIngredientsRepository.create(ingredientA)
    await inMemoryIngredientsRepository.create(ingredientB)

    const recipeIngredientA = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredientA.id,
      amount: 1,
      unit: MeasurementUnit.TEASPOON,
      position: 0,
      note: null,
    })

    const recipeIngredientB = RecipeIngredient.create({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredientB.id,
      amount: 2,
      unit: MeasurementUnit.PINCH,
      position: 1,
      note: null,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        ingredients: new RecipeIngredientList([
          recipeIngredientA,
          recipeIngredientB,
        ]),
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
          {
            id: recipeIngredientB.id.toString(),
            name: 'Pepper',
            amount: 2,
            unit: MeasurementUnit.PINCH,
          },
          {
            id: recipeIngredientA.id.toString(),
            name: 'Salt',
            amount: 1,
            unit: MeasurementUnit.TEASPOON,
          },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(
      inMemoryRecipesRepository.items[0].ingredients.getItems().map((item) => ({
        id: item.id.toString(),
        position: item.position,
      })),
    ).toEqual([
      { id: recipeIngredientB.id.toString(), position: 0 },
      { id: recipeIngredientA.id.toString(), position: 1 },
    ])
  })
})

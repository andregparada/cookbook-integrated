import { CreateRecipeUseCase } from './create-recipe'
import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeCreateRecipeUseCaseRequest } from 'test/factories/make-recipe'
import { makeTag } from 'test/factories/make-tag'
import { makeIngredient } from 'test/factories/make-ingredient'
import { RecipeCatalogResolver } from '../services/recipe-catalog-resolver'
import { RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { MeasurementUnit } from '@/domain/enterprise/entities/recipe-ingredient'
import { InvalidRecipeTimingOrServingsError } from '@/domain/enterprise/errors/invalid-recipe-timing-or-servings-error'
import { InvalidRecipeIngredientMeasurementError } from '@/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error'
import { InvalidRecipeInstructionsError } from '@/domain/enterprise/errors/invalid-recipe-instructions-error'
import { InvalidRecipeTagsError } from '@/domain/enterprise/errors/invalid-recipe-tags-error'
import { RecipeInstructions } from '@/domain/enterprise/entities/value-objects/recipe-instructions'
import { RecipeTagNames } from '@/domain/enterprise/entities/value-objects/recipe-tag-names'

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
    const result = await sut.execute(makeCreateRecipeUseCaseRequest())

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.ingredients.getItems()).toHaveLength(2)
      expect(result.value.recipe.status).toBe(RecipeStatus.DRAFT)
      expect(result.value.recipe.publishedAt).toBeNull()
    }

    expect(inMemoryRecipeIngredientsRepository.items).toHaveLength(2)
  })

  it('should reuse an existing tag when only casing differs', async () => {
    await inMemoryTagsRepository.create(makeTag({ name: 'Ovo' }))

    await sut.execute(makeCreateRecipeUseCaseRequest({ tags: ['ovo'] }))

    expect(inMemoryTagsRepository.items).toHaveLength(1)
    expect(inMemoryTagsRepository.items[0].name).toBe('Ovo')
  })

  // TODO: dedup do payload já está em recipe-tag-names.spec.ts.
  // Aqui vale o catálogo (1 Tag persistida / tagsIds na receita).
  it('should deduplicate tags within the same request', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        tags: ['Café da Manhã', 'cafe da manha'],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.tagsIds).toHaveLength(1)
    }

    expect(inMemoryTagsRepository.items).toHaveLength(1)
    expect(inMemoryTagsRepository.items[0].name).toBe('Café da Manhã')
  })

  // TODO: limite MAX_TAGS já está em recipe-tag-names.spec.ts.
  // Manter só InvalidRecipeTagsError + receita não persistida.
  it('should not allow more than the maximum number of tags', async () => {
    const tags = Array.from(
      { length: RecipeTagNames.MAX_TAGS + 1 },
      (_, index) => `tag-${index}`,
    )

    const result = await sut.execute(makeCreateRecipeUseCaseRequest({ tags }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
    expect(inMemoryRecipesRepository.items).toHaveLength(0)
  })

  // TODO: tag vazia já está em recipe-tag-names.spec.ts.
  // Manter só InvalidRecipeTagsError + receita não persistida.
  it('should not allow empty tag names', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({ tags: [''] }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeTagsError)
    expect(inMemoryRecipesRepository.items).toHaveLength(0)
  })

  // TODO: fundir com “reuse existing tag when only casing differs” — os dois cobrem o mesmo find-or-create.
  it('should preserve the display name from the first tag registration', async () => {
    await sut.execute(
      makeCreateRecipeUseCaseRequest({ tags: ['Café da Manhã'] }),
    )

    await sut.execute(
      makeCreateRecipeUseCaseRequest({ tags: ['cafe da manha'] }),
    )

    expect(inMemoryTagsRepository.items).toHaveLength(1)
    expect(inMemoryTagsRepository.items[0].name).toBe('Café da Manhã')
  })

  it('should reuse an existing ingredient when only casing differs', async () => {
    await inMemoryIngredientsRepository.create(
      makeIngredient({ name: 'Tomate' }),
    )

    await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          { name: 'tomate', amount: 3, unit: MeasurementUnit.UNIT },
        ],
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

  it('should allow ingredients with "to taste" measurement with null amount', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          { name: 'Salt', amount: null, unit: MeasurementUnit.TO_TASTE },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.ingredients.getItems()[0]).toMatchObject({
        amount: null,
        unit: MeasurementUnit.TO_TASTE,
      })
    }
  })

  it('should not allow ingredients with "to taste" measurement with amount', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          { name: 'Salt', amount: 2, unit: MeasurementUnit.TO_TASTE },
        ],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeIngredientMeasurementError)
  })

  it('should not allow null amount for non to_taste units', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          { name: 'Salt', amount: null, unit: MeasurementUnit.TABLESPOON },
        ],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeIngredientMeasurementError)
  })

  it('should assign position from payload order starting at zero', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          { name: 'Salt', amount: 1, unit: MeasurementUnit.TEASPOON },
          { name: 'Pepper', amount: 2, unit: MeasurementUnit.PINCH },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(
        result.value.recipe.ingredients.getItems().map((item) => item.position),
      ).toEqual([0, 1])
    }
  })

  // TODO: tirar a asserção da string normalizada — já está em recipe-instructions.spec.ts.
  // No use case basta isRight (o execute aplica o VO).
  it('should normalize instructions line breaks', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        instructions: '  Bata os ovos.\r\nLeve ao forno.  ',
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.instructions).toBe(
        'Bata os ovos.\nLeve ao forno.',
      )
    }
  })

  // TODO: limite de tamanho já está em recipe-instructions.spec.ts.
  // Manter só InvalidRecipeInstructionsError + receita não persistida.
  it('should not allow instructions longer than the maximum length', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        instructions: 'a'.repeat(RecipeInstructions.MAX_LENGTH + 1),
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidRecipeInstructionsError)
    expect(inMemoryRecipesRepository.items).toHaveLength(0)
  })

  it('should normalize ingredient note', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          {
            name: 'Salt',
            amount: 1,
            unit: MeasurementUnit.TEASPOON,
            note: '  picado fino  ',
          },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.ingredients.getItems()[0].note).toBe(
        'picado fino',
      )
    }
  })

  it('should treat blank ingredient note as null', async () => {
    const result = await sut.execute(
      makeCreateRecipeUseCaseRequest({
        recipeIngredients: [
          {
            name: 'Salt',
            amount: 1,
            unit: MeasurementUnit.TEASPOON,
            note: '   ',
          },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.recipe.ingredients.getItems()[0].note).toBeNull()
    }
  })
})

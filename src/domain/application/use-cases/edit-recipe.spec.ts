import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients--repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { EditRecipeUseCase } from './edit-recipe'
import { makeRecipe } from 'test/factories/make-recipe'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
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
    sut = new EditRecipeUseCase(
      inMemoryRecipesRepository,
      inMemoryIngredientsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
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

    // TODO acrescentar ingredientes e tags no teste

    const result = await sut.execute({
      recipeId: newRecipe.id.toValue(),
      authorId: 'author-1',
      name: 'New Name',
      description: 'New Description',
      instructions: 'New Instructions',
      tags: ['tag1', 'tag2'],
      recipeIngredients: [
        { name: 'Ingredient 1', amount: 2, unit: 'cups' },
        { name: 'Ingredient 2', amount: 1, unit: 'tbsp' },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'New Name',
      description: 'New Description',
      instructions: 'New Instructions',
    })
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

    const result = await sut.execute({
      recipeId: newRecipe.id.toValue(),
      authorId: 'author-2',
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'Original Name',
    })
  })

  it('should not be able to edit a non-existing recipe', async () => {
    const result = await sut.execute({
      recipeId: 'non-existing-recipe-id',
      authorId: 'author-1',
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

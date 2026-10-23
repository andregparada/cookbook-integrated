import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import {
  makeRecipe,
  makeDeleteRecipeUseCaseRequest,
} from 'test/factories/make-recipe'
import { makeTag } from 'test/factories/make-tag'
import { makeIngredient } from 'test/factories/make-ingredient'
import { makeRecipeIngredient } from 'test/factories/make-recipe-ingredient'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipeIngredientList } from '@/domain/enterprise/entities/recipe-ingredient-list'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeleteRecipeUseCase } from './delete-recipe'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: DeleteRecipeUseCase

describe('Delete Recipe', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
    inMemoryRecipesRepository = new InMemoryRecipesRepository(
      inMemoryChefsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
    )
    sut = new DeleteRecipeUseCase(inMemoryRecipesRepository)
  })

  it('should be able to soft delete a recipe', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeDeleteRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryRecipesRepository.items[0].deletedAt).toBeTruthy()
  })

  it('should keep global ingredients and tags when soft deleting a recipe', async () => {
    const tag = makeTag({ name: 'Jantar' })
    await inMemoryTagsRepository.create(tag)

    const ingredient = makeIngredient({ name: 'Tomate' })
    await inMemoryIngredientsRepository.create(ingredient)

    const recipeIngredient = makeRecipeIngredient({
      recipeId: new UniqueEntityID('recipe-1'),
      ingredientId: ingredient.id,
    })

    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
        tagsIds: [tag.id],
        ingredients: new RecipeIngredientList([recipeIngredient]),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeDeleteRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryTagsRepository.items).toEqual([tag])
    expect(inMemoryIngredientsRepository.items).toEqual([ingredient])
    expect(inMemoryRecipesRepository.items[0].tagsIds).toEqual([tag.id])
    expect(inMemoryRecipesRepository.items[0].ingredients.getItems()).toEqual([
      recipeIngredient,
    ])
  })

  it('should not be able to delete a recipe from another chef', async () => {
    const newRecipe = makeRecipe(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('recipe-1'),
    )

    await inMemoryRecipesRepository.create(newRecipe)

    const result = await sut.execute(
      makeDeleteRecipeUseCaseRequest({
        recipeId: 'recipe-1',
        actorId: 'author-2',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to delete a non-existing recipe', async () => {
    const result = await sut.execute(
      makeDeleteRecipeUseCaseRequest({
        recipeId: 'non-existing-recipe-id',
        actorId: 'author-1',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

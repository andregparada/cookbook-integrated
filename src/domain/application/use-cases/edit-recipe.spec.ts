import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients--repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { EditRecipeUseCase } from './edit-recipe'
import { makeRecipe } from 'test/factories/make-recipe'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let inMemoryRecipesRepository: InMemoryRecipesRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let sut: EditRecipeUseCase

describe('Edit Recipe', () => {
  beforeEach(() => {
    inMemoryRecipesRepository = new InMemoryRecipesRepository()
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
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

    // acrescentar tags e ingredients

    await sut.execute({
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

    expect(inMemoryRecipesRepository.items[0]).toMatchObject({
      name: 'New Name',
      description: 'New Description',
      instructions: 'New Instructions',
    })
  })

  // TODO fazer mais testes aqui, se necessário
})

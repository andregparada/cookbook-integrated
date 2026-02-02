import { CreateRecipeUseCase } from './create-recipe'
import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients--repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'

let inMemoryRecipesRepository: InMemoryRecipesRepository
let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let sut: CreateRecipeUseCase

describe('Create Recipe', () => {
  beforeEach(() => {
    inMemoryRecipesRepository = new InMemoryRecipesRepository()
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    inMemoryTagsRepository = new InMemoryTagsRepository()
    inMemoryRecipeIngredientsRepository =
      new InMemoryRecipeIngredientsRepository()
    sut = new CreateRecipeUseCase(
      inMemoryRecipesRepository,
      inMemoryIngredientsRepository,
      inMemoryTagsRepository,
      inMemoryRecipeIngredientsRepository,
    )
  })

  it('should be able to create a recipe', async () => {
    const result = await sut.execute({
      authorId: '1',
      title: 'Recipe Title',
      description: 'Recipe Description',
      instructions: 'Recipe Instructions',
      prepTimeInMinutes: 15,
      cookTimeInMinutes: 30,
      servings: 4,
      difficultyLevel: DifficultyLevel.EASY,
      tags: ['tag1', 'tag2'],
      recipeIngredients: [
        { name: 'Ingredient 1', amount: 2, unit: 'cups' },
        { name: 'Ingredient 2', amount: 1, unit: 'tbsp' },
      ],
    })

    expect(result.isRight()).toBe(true)
  })

  // TODO fazer mais testes aqui, se necessário
})

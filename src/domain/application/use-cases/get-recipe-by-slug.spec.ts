import { InMemoryRecipeIngredientsRepository } from 'test/repositories/in-memory-recipe-ingredients-repository'
import { InMemoryTagsRepository } from 'test/repositories/in-memory-tags-repository'
import { InMemoryRecipesRepository } from 'test/repositories/in-memory-recipes-repository'
import { makeRecipe } from 'test/factories/make-recipe'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { makeChef } from 'test/factories/make-chef'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'
import { GetRecipeBySlugUseCase } from './get-recipe-by-slug'

let inMemoryChefsRepository: InMemoryChefsRepository
let inMemoryTagsRepository: InMemoryTagsRepository
let inMemoryRecipeIngredientsRepository: InMemoryRecipeIngredientsRepository
let inMemoryRecipesRepository: InMemoryRecipesRepository
let sut: GetRecipeBySlugUseCase

describe('Get Recipe By Slug', () => {
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
    sut = new GetRecipeBySlugUseCase(inMemoryRecipesRepository)
  })

  it('should be able to get a recipe by slug', async () => {
    const chef = makeChef({ userName: 'John_Doe' })

    inMemoryChefsRepository.items.push(chef)

    const newRecipe = makeRecipe({
      authorId: chef.id,
      slug: Slug.create('example-recipe'),
    })

    inMemoryRecipesRepository.create(newRecipe)

    // acrescentar tags e ingredients

    const result = await sut.execute({
      slug: 'example-recipe',
    })

    expect(result.value).toMatchObject({
      recipe: expect.objectContaining({
        name: newRecipe.name,
        author: 'John_Doe',
      }),
    })
  })

  // TODO fazer mais testes aqui, se necessário
})

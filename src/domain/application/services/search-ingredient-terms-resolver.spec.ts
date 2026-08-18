import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryIngredientsRepository } from 'test/repositories/in-memory-ingredients-repository'
import { makeIngredient } from 'test/factories/make-ingredient'
import { SearchIngredientTermsResolver } from './search-ingredient-terms-resolver'

let inMemoryIngredientsRepository: InMemoryIngredientsRepository
let sut: SearchIngredientTermsResolver

describe('SearchIngredientTermsResolver', () => {
  beforeEach(() => {
    inMemoryIngredientsRepository = new InMemoryIngredientsRepository()
    sut = new SearchIngredientTermsResolver(inMemoryIngredientsRepository)
  })

  it('should resolve ingredient by normalized name', async () => {
    const chicken = makeIngredient({ name: 'Frango' }, new UniqueEntityID())

    await inMemoryIngredientsRepository.create(chicken)

    const result = await sut.resolve(['frango'])

    expect(result).toEqual({
      resolvedIds: [chicken.id.toString()],
      hasUnresolved: false,
    })
  })

  it('should resolve ingredient by id', async () => {
    const potato = makeIngredient({ name: 'Batata' }, new UniqueEntityID())

    await inMemoryIngredientsRepository.create(potato)

    const result = await sut.resolve([potato.id.toString()])

    expect(result).toEqual({
      resolvedIds: [potato.id.toString()],
      hasUnresolved: false,
    })
  })

  it('should deduplicate repeated terms by normalized name', async () => {
    const chicken = makeIngredient({ name: 'Frango' }, new UniqueEntityID())

    await inMemoryIngredientsRepository.create(chicken)

    const result = await sut.resolve(['Frango', 'frango', 'FRANGO'])

    expect(result).toEqual({
      resolvedIds: [chicken.id.toString()],
      hasUnresolved: false,
    })
  })

  it('should deduplicate repeated terms by id', async () => {
    const chicken = makeIngredient({ name: 'Frango' }, new UniqueEntityID())

    await inMemoryIngredientsRepository.create(chicken)

    const result = await sut.resolve([
      chicken.id.toString(),
      chicken.id.toString(),
    ])

    expect(result).toEqual({
      resolvedIds: [chicken.id.toString()],
      hasUnresolved: false,
    })
  })

  it('should mark unknown names as unresolved', async () => {
    const result = await sut.resolve(['unknown-ingredient'])

    expect(result).toEqual({
      resolvedIds: [],
      hasUnresolved: true,
    })
  })

  it('should mark unknown ids as unresolved', async () => {
    const unknownId = '00000000-0000-4000-8000-000000000001'

    const result = await sut.resolve([unknownId])

    expect(result).toEqual({
      resolvedIds: [],
      hasUnresolved: true,
    })
  })

  it('should resolve mixed known and unknown terms', async () => {
    const chicken = makeIngredient({ name: 'Frango' }, new UniqueEntityID())

    await inMemoryIngredientsRepository.create(chicken)

    const result = await sut.resolve(['frango', 'unknown'])

    expect(result).toEqual({
      resolvedIds: [chicken.id.toString()],
      hasUnresolved: true,
    })
  })
})

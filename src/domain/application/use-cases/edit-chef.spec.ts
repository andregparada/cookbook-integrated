import { makeChef } from 'test/factories/make-chef'
import { EditChefUseCase } from './edit-chef'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'

let inMemoryChefsRepository: InMemoryChefsRepository
let fakeHasher: FakeHasher
let sut: EditChefUseCase

describe('Edit Chef', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    fakeHasher = new FakeHasher()
    sut = new EditChefUseCase(inMemoryChefsRepository, fakeHasher)
  })

  it('should be able to edit a chef', async () => {
    const newChef = makeChef({}, new UniqueEntityID('chef-1'))

    await inMemoryChefsRepository.create(newChef)

    await sut.execute({
      chefId: newChef.id.toValue(),
      firstName: 'Outro Nome',
    })

    expect(inMemoryChefsRepository.items[0]).toMatchObject({
      firstName: 'Outro Nome',
    })
  })

  // TODO fazer mais testes aqui, em register e authenticate, se necessário
})

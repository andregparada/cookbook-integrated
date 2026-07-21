import { makeChef } from 'test/factories/make-chef'
import { EditChefUseCase } from './edit-chef'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

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

    const result = await sut.execute({
      actorId: 'chef-1',
      chefId: newChef.id.toValue(),
      firstName: 'Outro Nome',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0]).toMatchObject({
      firstName: 'Outro Nome',
    })
  })

  it('should not be able to edit another chef profile', async () => {
    const newChef = makeChef(
      { firstName: 'Original Name' },
      new UniqueEntityID('chef-1'),
    )

    await inMemoryChefsRepository.create(newChef)

    const result = await sut.execute({
      actorId: 'chef-2',
      chefId: newChef.id.toValue(),
      firstName: 'Outro Nome',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryChefsRepository.items[0]).toMatchObject({
      firstName: 'Original Name',
    })
  })

  it('should not be able to edit a non-existing chef', async () => {
    const result = await sut.execute({
      actorId: 'chef-1',
      chefId: 'non-existing-chef-id',
      firstName: 'Outro Nome',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})

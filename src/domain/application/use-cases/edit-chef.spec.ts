import { makeChef, makeEditChefUseCaseRequest } from 'test/factories/make-chef'
import { EditChefUseCase } from './edit-chef'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'

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

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: newChef.id.toValue(),
        firstName: 'Outro Nome',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0]).toMatchObject({
      firstName: 'Outro Nome',
    })
  })

  it('should be able to keep the same user name without re-validating format', async () => {
    const newChef = makeChef(
      { userName: 'legacy name' },
      new UniqueEntityID('chef-1'),
    )

    await inMemoryChefsRepository.create(newChef)

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: newChef.id.toValue(),
        userName: 'legacy name',
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0].userName).toBe('legacy name')
  })

  it('should not be able to edit another chef profile', async () => {
    const newChef = makeChef(
      { firstName: 'Original Name' },
      new UniqueEntityID('chef-1'),
    )

    await inMemoryChefsRepository.create(newChef)

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-2',
        chefId: newChef.id.toValue(),
        firstName: 'Outro Nome',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryChefsRepository.items[0]).toMatchObject({
      firstName: 'Original Name',
    })
  })

  it('should not be able to edit a non-existing chef', async () => {
    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: 'non-existing-chef-id',
        firstName: 'Outro Nome',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to take another chef user name', async () => {
    const chefOne = makeChef(
      { userName: 'chef_one' },
      new UniqueEntityID('chef-1'),
    )
    const chefTwo = makeChef(
      { userName: 'chef_two' },
      new UniqueEntityID('chef-2'),
    )

    await inMemoryChefsRepository.create(chefOne)
    await inMemoryChefsRepository.create(chefTwo)

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: 'chef-1',
        userName: 'chef_two',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items[0].userName).toBe('chef_one')
  })

  it('should not be able to take another chef email', async () => {
    const chefOne = makeChef(
      { email: 'chef1@example.com' },
      new UniqueEntityID('chef-1'),
    )
    const chefTwo = makeChef(
      { email: 'chef2@example.com' },
      new UniqueEntityID('chef-2'),
    )

    await inMemoryChefsRepository.create(chefOne)
    await inMemoryChefsRepository.create(chefTwo)

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: 'chef-1',
        email: 'chef2@example.com',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items[0].email).toBe('chef1@example.com')
  })

  // TODO: formato de userName já está em user-name.spec.ts.
  // Manter só InvalidUserNameError + userName inalterado.
  it('should not be able to change to an invalid user name', async () => {
    const newChef = makeChef(
      { userName: 'chef_one' },
      new UniqueEntityID('chef-1'),
    )

    await inMemoryChefsRepository.create(newChef)

    const result = await sut.execute(
      makeEditChefUseCaseRequest({
        actorId: 'chef-1',
        chefId: 'chef-1',
        userName: 'ab',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
    expect(inMemoryChefsRepository.items[0].userName).toBe('chef_one')
  })
})

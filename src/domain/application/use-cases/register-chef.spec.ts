import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { RegisterChefUseCase } from './register-chef'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'
import { makeRegisterChefUseCaseRequest } from 'test/factories/make-chef'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'

let inMemoryChefsRepository: InMemoryChefsRepository
let fakeHasher: FakeHasher
let sut: RegisterChefUseCase

describe('Register Chef', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    fakeHasher = new FakeHasher()
    sut = new RegisterChefUseCase(inMemoryChefsRepository, fakeHasher)
  })

  it('should be able to register a new chef', async () => {
    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    )

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0].hashedPassword).toEqual(
      hashedPassword,
    )
  })

  it('should not be able to register a chef with an existing email', async () => {
    await sut.execute(
      makeRegisterChefUseCaseRequest({
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        firstName: 'Jane',
        lastName: 'Doe',
        userName: 'janedoe',
        email: 'johndoe@example.com',
        password: '654321',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items).toHaveLength(1)
  })

  it('should not be able to register a chef with an existing email regardless of casing', async () => {
    await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'johndoe',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'janedoe',
        email: 'JohnDoe@Example.com',
        password: '654321',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items).toHaveLength(1)
  })

  it('should not be able to register a chef with an existing user name', async () => {
    await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'johndoe',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'johndoe',
        email: 'jane@example.com',
        password: '654321',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items).toHaveLength(1)
  })

  // TODO: formato de userName já está em user-name.spec.ts.
  // Manter só InvalidUserNameError + chef não persistido.
  it('should not be able to register a chef with an invalid user name', async () => {
    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'ab',
        email: 'johndoe@example.com',
        password: '123456',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
    expect(inMemoryChefsRepository.items).toHaveLength(0)
  })
})

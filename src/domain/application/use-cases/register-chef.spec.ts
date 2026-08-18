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
    const request = makeRegisterChefUseCaseRequest({ password: '123456' })

    const result = await sut.execute(request)

    const hashedPassword = await fakeHasher.hash(request.password)

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0].hashedPassword).toEqual(
      hashedPassword,
    )
  })

  it('should not be able to register a chef with an existing email', async () => {
    const email = 'johndoe@example.com'

    await sut.execute(
      makeRegisterChefUseCaseRequest({ email, userName: 'johndoe' }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({ email, userName: 'janedoe' }),
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
      }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'janedoe',
        email: 'JohnDoe@Example.com',
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
      }),
    )

    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'johndoe',
        email: 'jane@example.com',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items).toHaveLength(1)
  })

  it('should not be able to register a chef with an invalid user name', async () => {
    const result = await sut.execute(
      makeRegisterChefUseCaseRequest({
        userName: 'ab',
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidUserNameError)
    expect(inMemoryChefsRepository.items).toHaveLength(0)
  })
})

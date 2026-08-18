import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { AuthenticateChefUseCase } from './authenticate-chef'
import { makeChef } from 'test/factories/make-chef'
import { WrongCredentialsError } from './errors/wrong-credentials-error'

let inMemoryChefsRepository: InMemoryChefsRepository
let fakeHasher: FakeHasher
let fakeEncrypter: FakeEncrypter

let sut: AuthenticateChefUseCase

describe('Authenticate Chef', () => {
  beforeEach(() => {
    inMemoryChefsRepository = new InMemoryChefsRepository()
    fakeHasher = new FakeHasher()
    fakeEncrypter = new FakeEncrypter()
    sut = new AuthenticateChefUseCase(
      inMemoryChefsRepository,
      fakeHasher,
      fakeEncrypter,
    )
  })

  it('should be able to authenticate a chef', async () => {
    const password = '123456'
    const chef = makeChef({
      hashedPassword: await fakeHasher.hash(password),
    })

    inMemoryChefsRepository.items.push(chef)

    const result = await sut.execute({
      email: chef.email,
      password,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })

  it('should be able to authenticate with a different email casing', async () => {
    const password = '123456'
    const chef = makeChef({
      email: 'johndoe@example.com',
      hashedPassword: await fakeHasher.hash(password),
    })

    inMemoryChefsRepository.items.push(chef)

    const result = await sut.execute({
      email: 'JohnDoe@Example.com',
      password,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })

  it('should not be able to authenticate with a non-existing email', async () => {
    const result = await sut.execute({
      email: 'unknown@example.com',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not be able to authenticate with a wrong password', async () => {
    const password = '123456'
    const chef = makeChef({
      hashedPassword: await fakeHasher.hash(password),
    })

    inMemoryChefsRepository.items.push(chef)

    const result = await sut.execute({
      email: chef.email,
      password: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })
})

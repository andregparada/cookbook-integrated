import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { AuthenticateChefUseCase } from './authenticate-chef'
import { makeChef } from 'test/factories/make-chef'

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
    const chef = makeChef({
      email: 'johndoe@example.com',
      hashedPassword: await fakeHasher.hash('123456'),
    })

    inMemoryChefsRepository.items.push(chef)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })
})

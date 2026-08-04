import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { RegisterChefUseCase } from './register-chef'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'

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
    const result = await sut.execute({
      firstName: 'John',
      lastName: 'Doe',
      userName: 'johndoe',
      email: 'johndoe@example.com',
      password: '123456',
    })

    const hashedPassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(inMemoryChefsRepository.items[0].hashedPassword).toEqual(
      hashedPassword,
    )
  })

  it('should not be able to register a chef with an existing email', async () => {
    await sut.execute({
      firstName: 'John',
      lastName: 'Doe',
      userName: 'johndoe',
      email: 'johndoe@example.com',
      password: '123456',
    })

    const result = await sut.execute({
      firstName: 'Jane',
      lastName: 'Doe',
      userName: 'janedoe',
      email: 'johndoe@example.com',
      password: '654321',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ChefAlreadyExistsError)
    expect(inMemoryChefsRepository.items).toHaveLength(1)
  })
})

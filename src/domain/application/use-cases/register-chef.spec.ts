import { InMemoryChefsRepository } from 'test/repositories/in-memory-chefs-repository'
import { RegisterChefUseCase } from './register-chef'
import { FakeHasher } from 'test/cryptography/fake-hasher'

let inMemomoryyChefsRepository: InMemoryChefsRepository
let fakeHasher: FakeHasher
let sut: RegisterChefUseCase

describe('Register Chef', () => {
  beforeEach(() => {
    inMemomoryyChefsRepository = new InMemoryChefsRepository()
    fakeHasher = new FakeHasher()
    sut = new RegisterChefUseCase(inMemomoryyChefsRepository, fakeHasher)
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
    expect(inMemomoryyChefsRepository.items[0].hashedPassword).toEqual(
      hashedPassword,
    )
  })
})

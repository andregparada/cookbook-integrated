import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { HashComparer } from '../cryptography/hash-comparer'
import { Encrypter } from '../cryptography/encrypter'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { ChefsRepository } from '../repositories/chefs-repository'

interface AuthenticateChefUseCaseRequest {
  email: string
  password: string
}

type AuthenticateChefUseCaseResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateChefUseCase {
  constructor(
    private chefsRepository: ChefsRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateChefUseCaseRequest): Promise<AuthenticateChefUseCaseResponse> {
    const chef = await this.chefsRepository.findByEmail(email)

    if (!chef) {
      return left(new WrongCredentialsError())
    }

    const isPassworedValid = await this.hashComparer.compare(
      password,
      chef.hashedPassword,
    )

    if (!isPassworedValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: chef.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}

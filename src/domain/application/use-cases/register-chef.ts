import { Chef } from '../../enterprise/entities/chef'
import { Either, left, right } from '@/core/either'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'
import { ChefsRepository } from '../repositories/chefs-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { Injectable } from '@nestjs/common'

interface RegisterChefUseCaseRequest {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
  avatarId?: string
  bio?: string
}

type RegisterChefUseCaseResponse = Either<
  ChefAlreadyExistsError,
  {
    chef: Chef
  }
>

@Injectable()
export class RegisterChefUseCase {
  constructor(
    private chefsRepository: ChefsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    firstName,
    lastName,
    userName,
    email,
    password,
    avatarId,
    bio,
  }: RegisterChefUseCaseRequest): Promise<RegisterChefUseCaseResponse> {
    const chefWithSameEmail = await this.chefsRepository.findByEmail(email)

    if (chefWithSameEmail) {
      return left(new ChefAlreadyExistsError(email))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const chef = Chef.create({
      firstName,
      lastName,
      userName,
      email,
      hashedPassword,
      bio,
      avatarId,
    })

    // TODO tratar foto de avatar

    await this.chefsRepository.create(chef)

    return right({
      chef,
    })
  }
}

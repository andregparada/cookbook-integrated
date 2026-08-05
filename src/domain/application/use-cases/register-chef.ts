import { Chef } from '../../enterprise/entities/chef'
import { Either, left, right } from '@/core/either'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'
import { ChefsRepository } from '../repositories/chefs-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { Injectable } from '@nestjs/common'
import { UserName } from '@/domain/enterprise/entities/value-objects/user-name'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'

export interface RegisterChefUseCaseRequest {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
  avatarId?: string
  bio?: string
}

type RegisterChefUseCaseResponse = Either<
  ChefAlreadyExistsError | InvalidUserNameError,
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
    const userNameResult = UserName.create(userName)

    if (userNameResult.isLeft()) {
      return left(userNameResult.value)
    }

    const chefWithSameEmail = await this.chefsRepository.findByEmail(email)

    if (chefWithSameEmail) {
      return left(new ChefAlreadyExistsError(email))
    }

    const chefWithSameUserName =
      await this.chefsRepository.findByUserName(userName)

    if (chefWithSameUserName) {
      return left(new ChefAlreadyExistsError(userName))
    }

    const hashedPassword = await this.hashGenerator.hash(password)

    const chef = Chef.create({
      firstName,
      lastName,
      userName: userNameResult.value.value,
      email,
      hashedPassword,
      bio,
      avatarId,
    })

    await this.chefsRepository.create(chef)

    return right({
      chef,
    })
  }
}

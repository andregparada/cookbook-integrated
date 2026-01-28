import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Chef } from '@/domain/enterprise/entities/chef'
import { Injectable } from '@nestjs/common'
import { ChefsRepository } from '../repositories/chefs-repository'
import { HashGenerator } from '../cryptography/hash-generator'

interface EditChefUseCaseRequest {
  chefId: string
  firstName?: string
  lastName?: string
  userName?: string
  email?: string
  password?: string
  avatarId?: string
  bio?: string
}

type EditChefUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    chef: Chef
  }
>

@Injectable()
export class EditChefUseCase {
  constructor(
    private chefsRepository: ChefsRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    chefId,
    firstName,
    lastName,
    userName,
    email,
    password,
    avatarId,
    bio,
  }: EditChefUseCaseRequest): Promise<EditChefUseCaseResponse> {
    const chef = await this.chefsRepository.findById(chefId)

    if (!chef) {
      return left(new ResourceNotFoundError())
    }

    chef.firstName = firstName ?? chef.firstName
    chef.lastName = lastName ?? chef.lastName
    chef.userName = userName ?? chef.userName
    chef.email = email ?? chef.email
    if (password) {
      const hashedPassword = await this.hashGenerator.hash(password)
      chef.hashedPassword = hashedPassword
    }
    chef.avatarId = avatarId ?? chef.avatarId
    chef.bio = bio ?? chef.bio

    await this.chefsRepository.save(chef)

    return right({
      chef,
    })
  }
}

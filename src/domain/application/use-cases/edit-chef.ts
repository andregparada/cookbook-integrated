import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Chef, UpdateChefProps } from '@/domain/enterprise/entities/chef'
import { Injectable } from '@nestjs/common'
import { ChefsRepository } from '../repositories/chefs-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { UserName } from '@/domain/enterprise/entities/value-objects/user-name'
import { InvalidUserNameError } from '@/domain/enterprise/errors/invalid-user-name-error'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'

export interface EditChefUseCaseRequest {
  actorId: string
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
  | ResourceNotFoundError
  | NotAllowedError
  | ChefAlreadyExistsError
  | InvalidUserNameError,
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
    actorId,
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

    if (actorId !== chef.id.toString()) {
      return left(new NotAllowedError())
    }

    const updateProps: UpdateChefProps = {}

    if (
      userName !== undefined &&
      userName.toLowerCase() !== chef.userName.toLowerCase()
    ) {
      const userNameResult = UserName.create(userName)

      if (userNameResult.isLeft()) {
        return left(userNameResult.value)
      }

      const chefWithSameUserName =
        await this.chefsRepository.findByUserName(userName)

      if (chefWithSameUserName && !chefWithSameUserName.id.equals(chef.id)) {
        return left(new ChefAlreadyExistsError(userName))
      }

      updateProps.userName = userNameResult.value.value
    }

    if (
      email !== undefined &&
      email.toLowerCase() !== chef.email.toLowerCase()
    ) {
      const chefWithSameEmail = await this.chefsRepository.findByEmail(email)

      if (chefWithSameEmail && !chefWithSameEmail.id.equals(chef.id)) {
        return left(new ChefAlreadyExistsError(email))
      }

      updateProps.email = email
    }

    if (firstName !== undefined) updateProps.firstName = firstName
    if (lastName !== undefined) updateProps.lastName = lastName
    if (avatarId !== undefined) updateProps.avatarId = avatarId
    if (bio !== undefined) updateProps.bio = bio

    if (Object.keys(updateProps).length > 0) {
      chef.updateInfo(updateProps)
    }

    if (password) {
      chef.hashedPassword = await this.hashGenerator.hash(password)
    }

    await this.chefsRepository.save(chef)

    return right({
      chef,
    })
  }
}

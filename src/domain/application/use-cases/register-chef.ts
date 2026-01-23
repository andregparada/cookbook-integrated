import { Chef } from '../../enterprise/entities/chef'
import { Either, left, right } from '@/core/either'
import { ChefAlreadyExistsError } from './errors/chef-already-exists-error'
import { ChefsRepository } from '../repositories/chefs-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { ChefAttachment } from '@/domain/enterprise/entities/chef-attachment'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ChefAttachmentsList } from '@/domain/enterprise/entities/chef-attachments-list'

interface RegisterChefUseCaseRequest {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
  bio?: string
  attachmentsIds?: string[]
}

type RegisterChefUseCaseResponse = Either<
  ChefAlreadyExistsError,
  {
    chef: Chef
  }
>

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
    bio,
    attachmentsIds,
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
    })

    const chefAttachments = attachmentsIds?.map((attacnehmentId) => {
      return ChefAttachment.create({
        attachmentId: new UniqueEntityID(attacnehmentId),
        chefId: chef.id,
      })
    })

    chef.attachments = new ChefAttachmentsList(chefAttachments ?? [])

    await this.chefsRepository.create(chef)

    return right({
      chef,
    })
  }
}

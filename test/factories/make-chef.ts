import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaChefMapper } from '@/infra/database/prisma/mappers/prisma-chef-mapper'
import { Chef, ChefProps } from '@/domain/enterprise/entities/chef'
import { RegisterChefUseCaseRequest } from '@/domain/application/use-cases/register-chef'
import { EditChefUseCaseRequest } from '@/domain/application/use-cases/edit-chef'

function makeValidUserName(): string {
  const raw = faker.internet.username().replace(/[^a-zA-Z0-9_-]/g, '')
  const padded = raw.padEnd(3, 'a').slice(0, 30)

  return padded
}

export function makeChef(
  override: Partial<ChefProps> = {},
  id?: UniqueEntityID,
) {
  const chef = Chef.create(
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userName: makeValidUserName(),
      email: faker.internet.email(),
      hashedPassword: faker.internet.password(),
      avatarId: null,
      bio: faker.lorem.paragraph(),
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return chef
}

/** Input for `RegisterChefUseCase.execute` (unit specs). Not the domain entity — use `makeChef` for that. */
export function makeRegisterChefUseCaseRequest(
  override: Partial<RegisterChefUseCaseRequest> = {},
): RegisterChefUseCaseRequest {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    userName: makeValidUserName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    ...override,
  }
}

/** Input for `EditChefUseCase.execute` (unit specs). Not the domain entity — use `makeChef` for that. */
export function makeEditChefUseCaseRequest(
  override: Partial<EditChefUseCaseRequest> = {},
): EditChefUseCaseRequest {
  return {
    actorId: new UniqueEntityID().toString(),
    chefId: new UniqueEntityID().toString(),
    ...override,
  }
}

@Injectable()
export class ChefFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaChef(data: Partial<ChefProps> = {}): Promise<Chef> {
    const chef = makeChef(data)

    await this.prisma.user.create({
      data: PrismaChefMapper.toPrisma(chef),
    })

    return chef
  }
}

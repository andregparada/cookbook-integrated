import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaChefMapper } from '@/infra/database/prisma/mappers/prisma-chef-mapper'
import { Chef, ChefProps } from '@/domain/enterprise/entities/chef'

export function makeChef(
  override: Partial<ChefProps> = {},
  id?: UniqueEntityID,
) {
  const chef = Chef.create(
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      userName: faker.internet.displayName(),
      email: faker.internet.email(),
      hashedPassword: faker.internet.password(),
      avatarId: null, // TODO o que fazer com esse avatarId
      bio: faker.lorem.paragraph(),
      createdAt: new Date(),
      ...override,
    },
    id,
  )

  return chef
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

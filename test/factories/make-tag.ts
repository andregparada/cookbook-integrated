import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tag, TagProps } from '@/domain/enterprise/entities/tag'
import { PrismaTagMapper } from '@/infra/database/prisma/mappers/prisma-tag-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'

export function makeTag(override: Partial<TagProps> = {}, id?: UniqueEntityID) {
  const tag = Tag.create(
    {
      name: faker.lorem.word(),
      ...override,
    },
    id,
  )

  return tag
}

@Injectable()
export class TagFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaTag(data: Partial<TagProps> = {}, id?: UniqueEntityID) {
    const tag = makeTag(data, id)

    const existingTag = await this.prisma.tag.findUnique({
      where: { normalizedName: tag.normalizedName.value },
    })

    if (existingTag) {
      return PrismaTagMapper.toDomain(existingTag)
    }

    await this.prisma.tag.create({
      data: PrismaTagMapper.toPrisma(tag),
    })

    return tag
  }
}

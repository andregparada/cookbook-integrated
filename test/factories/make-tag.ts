import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tag, TagProps } from '@/domain/enterprise/entities/tag'
import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'
import { PrismaTagMapper } from '@/infra/database/prisma/mappers/prisma-tag-mapper'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { faker } from '@faker-js/faker'
import { Injectable } from '@nestjs/common'
import { makeCatalogDisplayNameForTag } from './make-catalog-display-name'

type MakeTagOverride = Partial<Omit<TagProps, 'name'>> & {
  name?: string | CatalogDisplayName
}

export function makeTag(override: MakeTagOverride = {}, id?: UniqueEntityID) {
  const { name: nameOverride, ...rest } = override

  const tag = Tag.create(
    {
      name: nameOverride
        ? makeCatalogDisplayNameForTag(nameOverride)
        : makeCatalogDisplayNameForTag(faker.lorem.word()),
      ...rest,
    },
    id,
  )

  return tag
}

@Injectable()
export class TagFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaTag(data: MakeTagOverride = {}, id?: UniqueEntityID) {
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

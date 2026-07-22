import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tag } from '@/domain/enterprise/entities/tag'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { Prisma, Tag as PrismaTag } from '@prisma/client'

export class PrismaTagMapper {
  static toDomain(raw: PrismaTag): Tag {
    return Tag.create(
      {
        name: raw.name,
        normalizedName: NormalizedName.create(raw.normalizedName),
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(tag: Tag): Prisma.TagUncheckedCreateInput {
    return {
      id: tag.id.toString(),
      name: tag.name,
      normalizedName: tag.normalizedName.value,
    }
  }
}

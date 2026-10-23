import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Tag } from '@/domain/enterprise/entities/tag'
import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { Prisma, Tag as PrismaTag } from '@prisma/client'

export class PrismaTagMapper {
  static toDomain(raw: PrismaTag): Tag {
    return Tag.create(
      {
        name: CatalogDisplayName.reconstitute(raw.name),
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

import { Tag } from '@/domain/enterprise/entities/tag'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

export abstract class TagsRepository {
  abstract findByNormalizedName(
    normalizedName: NormalizedName,
  ): Promise<Tag | null>

  abstract create(tag: Tag): Promise<void>
}

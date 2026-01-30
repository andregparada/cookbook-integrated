import { Tag } from '@/domain/enterprise/entities/tag'

export abstract class TagsRepository {
  abstract findByNormalizedName(normalizedName: string): Promise<Tag | null>
  abstract create(tag: Tag): Promise<void>
}

import { TagsRepository } from '@/domain/application/repositories/tags-repository'
import { Tag } from '@/domain/enterprise/entities/tag'

export class InMemoryTagsRepository implements TagsRepository {
  public items: Tag[] = []

  async findByNormalizedName(normalizedName: string) {
    const tag = this.items.find((item) => item.slug.value === normalizedName)

    if (!tag) {
      return null
    }

    return tag
  }

  async create(tag: Tag) {
    this.items.push(tag)
  }
}

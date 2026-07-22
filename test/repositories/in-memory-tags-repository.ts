import { TagsRepository } from '@/domain/application/repositories/tags-repository'
import { Tag } from '@/domain/enterprise/entities/tag'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'

export class InMemoryTagsRepository implements TagsRepository {
  public items: Tag[] = []

  async findByNormalizedName(normalizedName: NormalizedName) {
    const tag = this.items.find(
      (item) => item.normalizedName.value === normalizedName.value,
    )

    if (!tag) {
      return null
    }

    return tag
  }

  async create(tag: Tag) {
    this.items.push(tag)
  }
}

import { TagsRepository } from '@/domain/application/repositories/tags-repository'
import { Injectable } from '@nestjs/common'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { PrismaService } from '../prisma.service'
import { Tag } from '@/domain/enterprise/entities/tag'
import { PrismaTagMapper } from '../mappers/prisma-tag-mapper'

@Injectable()
export class PrismaTagsRepository implements TagsRepository {
  constructor(private prisma: PrismaService) {}

  async findByNormalizedName(normalizedName: NormalizedName) {
    const tag = await this.prisma.tag.findUnique({
      where: {
        normalizedName: normalizedName.value,
      },
    })

    if (!tag) {
      return null
    }

    return PrismaTagMapper.toDomain(tag)
  }

  async create(tag: Tag) {
    const data = PrismaTagMapper.toPrisma(tag)

    await this.prisma.tag.create({
      data,
    })
  }
}

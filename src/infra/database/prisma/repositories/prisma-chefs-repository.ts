import { ChefsRepository } from '@/domain/application/repositories/chefs-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Chef } from '@/domain/enterprise/entities/chef'
import { PrismaChefMapper } from '../mappers/prisma-chef-mapper'

@Injectable()
export class PrismaChefsRepository implements ChefsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Chef | null> {
    const chef = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })

    if (!chef) {
      return null
    }

    return PrismaChefMapper.toDomain(chef)
  }

  async save(chef: Chef): Promise<void> {
    const data = PrismaChefMapper.toPrisma(chef)

    await this.prisma.user.update({
      where: {
        id: chef.id.toString(),
      },
      data,
    })
  }

  async findByEmail(email: string): Promise<Chef | null> {
    const chef = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    })

    if (!chef) {
      return null
    }

    return PrismaChefMapper.toDomain(chef)
  }

  async findByUserName(userName: string): Promise<Chef | null> {
    const chef = await this.prisma.user.findFirst({
      where: {
        userName: {
          equals: userName,
          mode: 'insensitive',
        },
      },
    })

    if (!chef) {
      return null
    }

    return PrismaChefMapper.toDomain(chef)
  }

  async create(chef: Chef): Promise<void> {
    const data = PrismaChefMapper.toPrisma(chef)

    await this.prisma.user.create({
      data,
    })
  }
}

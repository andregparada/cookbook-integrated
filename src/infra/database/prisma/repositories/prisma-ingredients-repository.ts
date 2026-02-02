import { IngredientsRepository } from '@/domain/application/repositories/ingredients-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { PrismaIngredientMapper } from '../mappers/prisma-ingredient-mapper'

@Injectable()
export class PrismaIngredientsRepository implements IngredientsRepository {
  constructor(private prisma: PrismaService) {}

  async findByNormalizedName(normalizedName: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        name: normalizedName,
      },
    })

    if (!ingredient) {
      return null
    }

    return PrismaIngredientMapper.toDomain(ingredient)
  }

  async create(ingredient: Ingredient) {
    const data = PrismaIngredientMapper.toPrisma(ingredient)

    await this.prisma.ingredient.create({
      data,
    })
  }
}

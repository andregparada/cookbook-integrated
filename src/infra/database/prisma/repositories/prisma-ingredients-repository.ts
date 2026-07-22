import { IngredientsRepository } from '@/domain/application/repositories/ingredients-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Ingredient } from '@/domain/enterprise/entities/ingredient'
import { NormalizedName } from '@/domain/enterprise/entities/value-objects/normalized-name'
import { PrismaIngredientMapper } from '../mappers/prisma-ingredient-mapper'

@Injectable()
export class PrismaIngredientsRepository implements IngredientsRepository {
  constructor(private prisma: PrismaService) {}

  async findByNormalizedName(normalizedName: NormalizedName) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: {
        normalizedName: normalizedName.value,
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

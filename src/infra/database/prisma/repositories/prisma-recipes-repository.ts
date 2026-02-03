import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { PrismaRecipeMapper } from '../mappers/prisma-recipe-mapper'

@Injectable()
export class PrismaRecipesRepository implements RecipesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: {
        id,
      },
    })

    if (!recipe) {
      return null
    }

    return PrismaRecipeMapper.toDomain(recipe)
  }

  async create(recipe: Recipe): Promise<void> {
    const data = PrismaRecipeMapper.toPrisma(recipe)

    await this.prisma.recipe.create({
      data,
    })
  }

  async save(recipe: Recipe) {
    const data = PrismaRecipeMapper.toPrisma(recipe)

    await this.prisma.recipe.update({
      where: {
        id: data.id,
      },
      data,
    })
  }
}

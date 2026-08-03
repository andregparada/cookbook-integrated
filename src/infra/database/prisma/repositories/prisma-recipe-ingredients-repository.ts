import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { PrismaRecipeIngredientMapper } from '../mappers/prisma-recipe-ingredient-mapper'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

@Injectable()
export class PrismaRecipeIngredientsRepository implements RecipeIngredientsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const recipeIngredient = await this.prisma.recipeIngredient.findUnique({
      where: {
        id,
      },
    })

    if (!recipeIngredient) {
      return null
    }

    return PrismaRecipeIngredientMapper.toDomain(recipeIngredient)
  }

  async findManyByRecipeId(recipeId: string) {
    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: {
        recipeId,
      },
    })

    return recipeIngredients.map(PrismaRecipeIngredientMapper.toDomain)
  }

  async createMany(items: RecipeIngredient[]) {
    if (items.length === 0) {
      return
    }

    await this.prisma.recipeIngredient.createMany({
      data: items.map(PrismaRecipeIngredientMapper.toPrisma),
    })
  }

  async deleteMany(items: RecipeIngredient[]) {
    if (items.length === 0) {
      return
    }

    await this.prisma.recipeIngredient.deleteMany({
      where: {
        id: {
          in: items.map((item) => item.id.toString()),
        },
      },
    })
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { PrismaRecipeIngredientMapper } from '../mappers/prisma-recipe-ingredient-mapper'

@Injectable()
export class PrismaRecipeIngredientsRepository implements RecipeIngredientsRepository {
  constructor(private prisma: PrismaService) {}

  async findManyByRecipeId(recipeId: string) {
    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: {
        recipeId,
      },
    })

    return recipeIngredients.map(PrismaRecipeIngredientMapper.toDomain)
  }
}

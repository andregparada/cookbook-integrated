import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RecipeIngredientsRepository } from '@/domain/application/repositories/recipe-ingredients-repository'
import { PrismaRecipeIngredientMapper } from '../mappers/prisma-recipe-ingredient-mapper'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'

@Injectable()
export class PrismaRecipeIngredientsRepository implements RecipeIngredientsRepository {
  constructor(private prisma: PrismaService) {}

  async create(recipeingredient: RecipeIngredient) {
    const data = PrismaRecipeIngredientMapper.toPrisma(recipeingredient)

    await this.prisma.recipeIngredient.create({
      data,
    })
  }
}

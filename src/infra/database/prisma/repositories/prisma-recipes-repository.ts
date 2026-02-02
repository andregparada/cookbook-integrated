import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { PrismaRecipeMapper } from '../mappers/prisma-recipe-mapper'

@Injectable()
export class PrismaRecipesRepository implements RecipesRepository {
  constructor(private prisma: PrismaService) {}

  async create(recipe: Recipe): Promise<void> {
    const data = PrismaRecipeMapper.toPrisma(recipe)

    await this.prisma.recipe.create({
      data,
    })
  }
}

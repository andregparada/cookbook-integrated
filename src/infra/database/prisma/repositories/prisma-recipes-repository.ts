import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaRecipeDetailsMapper } from '../mappers/prisma-recipe-details-mapper'
import { PrismaRecipeIngredientMapper } from '../mappers/prisma-recipe-ingredient-mapper'
import { PrismaRecipeMapper } from '../mappers/prisma-recipe-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaRecipesRepository implements RecipesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!recipe) {
      return null
    }

    return PrismaRecipeMapper.toDomain(recipe)
  }

  async findDetailsById(id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: true,
        tags: true,
        ingredients: true,
      },
    })

    if (!recipe) {
      return null
    }

    return PrismaRecipeDetailsMapper.toDomain(recipe)
  }

  async create(recipe: Recipe): Promise<void> {
    const data = PrismaRecipeMapper.toPrisma(recipe)
    const recipeId = recipe.id.toString()

    await this.prisma.$transaction(async (transaction) => {
      await transaction.recipe.create({
        data,
      })

      await this.createRecipeIngredients(
        transaction,
        recipe.ingredients.getItems(),
      )

      await this.syncRecipeTags(transaction, recipeId, recipe.tagsIds)
    })
  }

  async save(recipe: Recipe) {
    const {
      slug,
      name,
      description,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficultyLevel,
      status,
      publishedAt,
      deletedAt,
      createdAt,
      updatedAt,
    } = PrismaRecipeMapper.toPrisma(recipe)
    const recipeId = recipe.id.toString()

    await this.prisma.$transaction(async (transaction) => {
      await transaction.recipe.update({
        where: {
          id: recipeId,
        },
        data: {
          slug,
          name,
          description,
          instructions,
          prepTime,
          cookTime,
          servings,
          difficultyLevel,
          status,
          publishedAt,
          deletedAt,
          createdAt,
          updatedAt,
          tags: this.tagsSetInput(recipe.tagsIds),
        },
      })

      await this.createRecipeIngredients(
        transaction,
        recipe.ingredients.getNewItems(),
      )

      await this.deleteRecipeIngredients(
        transaction,
        recipe.ingredients.getRemovedItems(),
      )
    })
  }

  private tagsSetInput(
    tagsIds: UniqueEntityID[],
  ): Prisma.TagUpdateManyWithoutRecipesNestedInput {
    return {
      set: tagsIds.map((tagId) => ({
        id: tagId.toString(),
      })),
    }
  }

  private async syncRecipeTags(
    transaction: Prisma.TransactionClient,
    recipeId: string,
    tagsIds: UniqueEntityID[],
  ) {
    await transaction.recipe.update({
      where: {
        id: recipeId,
      },
      data: {
        tags: this.tagsSetInput(tagsIds),
      },
    })
  }

  private async createRecipeIngredients(
    transaction: Prisma.TransactionClient,
    items: RecipeIngredient[],
  ) {
    if (items.length === 0) {
      return
    }

    await transaction.recipeIngredient.createMany({
      data: items.map(PrismaRecipeIngredientMapper.toPrisma),
    })
  }

  private async deleteRecipeIngredients(
    transaction: Prisma.TransactionClient,
    items: RecipeIngredient[],
  ) {
    if (items.length === 0) {
      return
    }

    await transaction.recipeIngredient.deleteMany({
      where: {
        id: {
          in: items.map((item) => item.id.toString()),
        },
      },
    })
  }
}

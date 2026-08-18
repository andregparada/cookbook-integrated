import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  RecipesRepository,
  RecipeSearchScope,
  SearchRecipesParams,
} from '@/domain/application/repositories/recipes-repository'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { RecipeIngredient } from '@/domain/enterprise/entities/recipe-ingredient'
import { Injectable } from '@nestjs/common'
import { Prisma, RecipeStatus as PrismaRecipeStatus } from '@prisma/client'
import { PrismaRecipeDetailsMapper } from '../mappers/prisma-recipe-details-mapper'
import { PrismaRecipeIngredientMapper } from '../mappers/prisma-recipe-ingredient-mapper'
import { mapMeasurementUnitToPrisma } from '../mappers/enum-mappers'
import { PrismaRecipeMapper } from '../mappers/prisma-recipe-mapper'
import { PrismaService } from '../prisma.service'
import { buildPaginatedResult } from '@/core/repositories/paginated-result'
import { PrismaRecipeListMapper } from '../mappers/prisma-recipe-list-mapper'
import { IngredientMatchMode } from '@/domain/application/use-cases/search-recipes/search-recipes-params'

@Injectable()
export class PrismaRecipesRepository implements RecipesRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        tags: {
          select: {
            id: true,
          },
        },
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
        ingredients: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    if (!recipe) {
      return null
    }

    return PrismaRecipeDetailsMapper.toDomain(recipe)
  }

  async findMany(params: SearchRecipesParams) {
    const where: Prisma.RecipeWhereInput = {
      deletedAt: null,
      ...(params.scope === RecipeSearchScope.GLOBAL
        ? { status: PrismaRecipeStatus.Published }
        : { authorId: params.actorId }),
      ...(params.query
        ? {
            OR: [
              { name: { contains: params.query, mode: 'insensitive' } },
              {
                description: { contains: params.query, mode: 'insensitive' },
              },
            ],
          }
        : {}),
      ...(params.ingredients && params.ingredients.length > 0
        ? params.ingredientMatch === IngredientMatchMode.ANY
          ? {
              ingredients: {
                some: {
                  ingredientId: {
                    in: params.ingredients,
                  },
                },
              },
            }
          : {
              AND: params.ingredients.map((ingredientId) => ({
                ingredients: {
                  some: {
                    ingredientId,
                  },
                },
              })),
            }
        : {}),
    }

    const skip = (params.page - 1) * params.perPage

    const [recipes, totalItems] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        include: {
          author: true,
          tags: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip,
        take: params.perPage,
      }),
      this.prisma.recipe.count({ where }),
    ])

    const items = recipes.map((recipe) =>
      PrismaRecipeListMapper.toDomain(recipe, params.listReadModel),
    )

    return buildPaginatedResult(items, params.page, params.perPage, totalItems)
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

      await this.updateRecipeIngredients(
        transaction,
        recipe.ingredients.getUpdatedItems(),
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

  private async updateRecipeIngredients(
    transaction: Prisma.TransactionClient,
    items: RecipeIngredient[],
  ) {
    for (const item of items) {
      await transaction.recipeIngredient.update({
        where: {
          id: item.id.toString(),
        },
        data: {
          ingredientId: item.ingredientId.toString(),
          amount: item.amount,
          unit: mapMeasurementUnitToPrisma(item.unit),
          position: item.position,
          note: item.note,
        },
      })
    }
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

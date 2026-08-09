import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'
import { Prisma, Recipe as PrismaRecipe } from '@prisma/client'
import {
  mapDifficultyLevelToDomain,
  mapDifficultyLevelToPrisma,
  mapRecipeStatusToDomain,
  mapRecipeStatusToPrisma,
} from './enum-mappers'

type PrismaRecipeWithTags = PrismaRecipe & {
  tags?: { id: string }[]
}

export class PrismaRecipeMapper {
  static toDomain(raw: PrismaRecipeWithTags): Recipe {
    return Recipe.create(
      {
        authorId: new UniqueEntityID(raw.authorId),
        name: raw.name,
        slug: Slug.create(raw.slug),
        description: raw.description,
        instructions: raw.instructions,
        prepTimeInMinutes: raw.prepTime,
        cookTimeInMinutes: raw.cookTime,
        servings: raw.servings,
        difficultyLevel: mapDifficultyLevelToDomain(raw.difficultyLevel),
        status: mapRecipeStatusToDomain(raw.status),
        publishedAt: raw.publishedAt,
        deletedAt: raw.deletedAt,
        tagsIds: raw.tags?.map((tag) => new UniqueEntityID(tag.id)) ?? [],
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrisma(recipe: Recipe): Prisma.RecipeUncheckedCreateInput {
    return {
      id: recipe.id.toString(),
      slug: recipe.slug.value,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTime: recipe.prepTimeInMinutes,
      cookTime: recipe.cookTimeInMinutes,
      servings: recipe.servings,
      difficultyLevel: mapDifficultyLevelToPrisma(recipe.difficultyLevel),
      status: mapRecipeStatusToPrisma(recipe.status),
      publishedAt: recipe.publishedAt,
      deletedAt: recipe.deletedAt,
      authorId: recipe.authorId.toString(),
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }
  }
}

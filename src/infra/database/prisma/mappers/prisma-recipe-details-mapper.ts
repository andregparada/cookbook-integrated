import {
  Recipe as PrismaRecipe,
  User as PrismaUser,
  Tag as PrismaTag,
  RecipeIngredient as PrismaRecipeIngredients,
} from '@prisma/client'
import {
  mapDifficultyLevelToDomain,
  mapRecipeStatusToDomain,
} from './enum-mappers'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'
import { PrismaTagMapper } from './prisma-tag-mapper'
import { PrismaRecipeIngredientMapper } from './prisma-recipe-ingredient-mapper'

type PrismaRecipeDetails = PrismaRecipe & {
  author: PrismaUser
  tags: PrismaTag[]
  ingredients: PrismaRecipeIngredients[]
}

export class PrismaRecipeDetailsMapper {
  static toDomain(raw: PrismaRecipeDetails): RecipeDetails {
    return RecipeDetails.create({
      authorId: new UniqueEntityID(raw.authorId),
      author: raw.author.userName,
      recipeId: new UniqueEntityID(raw.id),
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
      tags: raw.tags.map(PrismaTagMapper.toDomain),
      recipeIngredients: raw.ingredients.map(
        PrismaRecipeIngredientMapper.toDomain,
      ),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}

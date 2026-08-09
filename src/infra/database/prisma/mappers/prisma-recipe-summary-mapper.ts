import {
  Recipe as PrismaRecipe,
  User as PrismaUser,
  Tag as PrismaTag,
} from '@prisma/client'
import {
  mapDifficultyLevelToDomain,
  mapRecipeStatusToDomain,
} from './enum-mappers'
import { RecipeSummary } from '@/domain/enterprise/entities/value-objects/recipe-summary'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'
import { PrismaTagMapper } from './prisma-tag-mapper'

type PrismaRecipeSummary = PrismaRecipe & {
  author: PrismaUser
  tags: PrismaTag[]
}

export class PrismaRecipeSummaryMapper {
  static toDomain(raw: PrismaRecipeSummary): RecipeSummary {
    return RecipeSummary.create({
      authorId: new UniqueEntityID(raw.authorId),
      author: raw.author.userName,
      recipeId: new UniqueEntityID(raw.id),
      name: raw.name,
      slug: Slug.create(raw.slug),
      description: raw.description,
      prepTimeInMinutes: raw.prepTime,
      cookTimeInMinutes: raw.cookTime,
      servings: raw.servings,
      difficultyLevel: mapDifficultyLevelToDomain(raw.difficultyLevel),
      status: mapRecipeStatusToDomain(raw.status),
      publishedAt: raw.publishedAt,
      tags: raw.tags.map(PrismaTagMapper.toDomain),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }
}

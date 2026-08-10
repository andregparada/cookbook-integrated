import {
  Recipe as PrismaRecipe,
  User as PrismaUser,
  Tag as PrismaTag,
} from '@prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from '@/domain/enterprise/entities/value-objects/slug'
import { RecipeAuthorWorkspaceItem } from '@/domain/enterprise/entities/value-objects/recipe-author-workspace-item'
import { RecipeCatalogCard } from '@/domain/enterprise/entities/value-objects/recipe-catalog-card'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import { RecipeSearchResultItem } from '@/domain/enterprise/entities/value-objects/recipe-search-result-item'
import { RecipeListReadModel } from '@/domain/application/search/search-recipes-params'
import {
  mapDifficultyLevelToDomain,
  mapRecipeStatusToDomain,
} from './enum-mappers'
import { PrismaTagMapper } from './prisma-tag-mapper'

type PrismaRecipeList = PrismaRecipe & {
  author: PrismaUser
  tags: PrismaTag[]
}

export class PrismaRecipeListMapper {
  static toDomain(
    raw: PrismaRecipeList,
    listReadModel: RecipeListReadModel,
  ): RecipeListItem {
    const tags = raw.tags.map(PrismaTagMapper.toDomain)

    if (listReadModel === RecipeListReadModel.CATALOG_CARD) {
      return RecipeCatalogCard.create({
        recipeId: new UniqueEntityID(raw.id),
        name: raw.name,
        slug: Slug.create(raw.slug),
        description: raw.description,
        tags,
      })
    }

    if (listReadModel === RecipeListReadModel.AUTHOR_WORKSPACE_ITEM) {
      return RecipeAuthorWorkspaceItem.create({
        recipeId: new UniqueEntityID(raw.id),
        name: raw.name,
        slug: Slug.create(raw.slug),
        status: mapRecipeStatusToDomain(raw.status),
        description: raw.description,
        tags,
      })
    }

    return RecipeSearchResultItem.create({
      recipeId: new UniqueEntityID(raw.id),
      name: raw.name,
      slug: Slug.create(raw.slug),
      description: raw.description,
      tags,
      prepTimeInMinutes: raw.prepTime,
      cookTimeInMinutes: raw.cookTime,
      difficultyLevel: mapDifficultyLevelToDomain(raw.difficultyLevel),
      author: raw.author.userName,
    })
  }
}

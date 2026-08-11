import {
  RecipesRepository,
  RecipeSearchScope,
  SearchRecipesParams,
} from '@/domain/application/repositories/recipes-repository'
import { Recipe, RecipeStatus } from '@/domain/enterprise/entities/recipe'
import { InMemoryChefsRepository } from './in-memory-chefs-repository'
import { InMemoryTagsRepository } from './in-memory-tags-repository'
import { InMemoryRecipeIngredientsRepository } from './in-memory-recipe-ingredients-repository'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'
import { buildPaginatedResult } from '@/core/repositories/paginated-result'
import { RecipeListReadModel } from '@/domain/application/use-cases/search-recipes/search-recipes-params'
import { RecipeCatalogCard } from '@/domain/enterprise/entities/value-objects/recipe-catalog-card'
import { RecipeAuthorWorkspaceItem } from '@/domain/enterprise/entities/value-objects/recipe-author-workspace-item'
import { RecipeSearchResultItem } from '@/domain/enterprise/entities/value-objects/recipe-search-result-item'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import { recipeMatchesTextQuery } from '@/domain/application/use-cases/search-recipes/recipe-text-query-match'

export class InMemoryRecipesRepository implements RecipesRepository {
  public items: Recipe[] = []

  constructor(
    private chefsRepository: InMemoryChefsRepository,
    private tagsRepository: InMemoryTagsRepository,
    private recipeIngredientsRepository: InMemoryRecipeIngredientsRepository,
  ) {}

  async findById(id: string) {
    const recipe = this.items.find(
      (item) => item.id.toString() === id && item.deletedAt === null,
    )

    if (!recipe) {
      return null
    }

    return recipe
  }

  async findDetailsById(id: string) {
    const recipe = this.items.find(
      (item) => item.id.toString() === id && item.deletedAt === null,
    )

    if (!recipe) {
      return null
    }

    const author = this.resolveAuthor(recipe)
    const tags = this.resolveTags(recipe)
    const recipeIngredients = recipe.ingredients.getItems()

    return RecipeDetails.create({
      authorId: author.id,
      author: author.userName,
      name: recipe.name,
      slug: recipe.slug,
      description: recipe.description,
      instructions: recipe.instructions,
      prepTimeInMinutes: recipe.prepTimeInMinutes,
      cookTimeInMinutes: recipe.cookTimeInMinutes,
      servings: recipe.servings,
      difficultyLevel: recipe.difficultyLevel,
      status: recipe.status,
      publishedAt: recipe.publishedAt,
      tags,
      recipeIngredients,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      recipeId: recipe.id,
    })
  }

  async findMany(params: SearchRecipesParams) {
    const filtered = this.items.filter((recipe) => {
      if (recipe.deletedAt !== null) {
        return false
      }

      if (params.scope === RecipeSearchScope.GLOBAL) {
        if (recipe.status !== RecipeStatus.PUBLISHED) {
          return false
        }
      } else if (recipe.authorId.toString() !== params.actorId) {
        return false
      }

      if (
        params.query &&
        !recipeMatchesTextQuery(recipe.name, recipe.description, params.query)
      ) {
        return false
      }

      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      const createdAtDiff = b.createdAt.getTime() - a.createdAt.getTime()

      if (createdAtDiff !== 0) {
        return createdAtDiff
      }

      return a.id.toString().localeCompare(b.id.toString())
    })

    const start = (params.page - 1) * params.perPage
    const pageItems = sorted.slice(start, start + params.perPage)

    const listItems = pageItems.map((recipe) =>
      this.toListItem(recipe, params.listReadModel),
    )

    return buildPaginatedResult(
      listItems,
      params.page,
      params.perPage,
      sorted.length,
    )
  }

  async create(recipe: Recipe) {
    this.items.push(recipe)

    await this.recipeIngredientsRepository.createMany(
      recipe.ingredients.getItems(),
    )
  }

  async save(recipe: Recipe) {
    const recipeIndex = this.items.findIndex((item) =>
      item.id.equals(recipe.id),
    )

    this.items[recipeIndex] = recipe

    await this.recipeIngredientsRepository.createMany(
      recipe.ingredients.getNewItems(),
    )

    await this.recipeIngredientsRepository.updateMany(
      recipe.ingredients.getUpdatedItems(),
    )

    await this.recipeIngredientsRepository.deleteMany(
      recipe.ingredients.getRemovedItems(),
    )
  }

  private toListItem(
    recipe: Recipe,
    listReadModel: RecipeListReadModel,
  ): RecipeListItem {
    const author = this.resolveAuthor(recipe)
    const tags = this.resolveTags(recipe)

    if (listReadModel === RecipeListReadModel.CATALOG_CARD) {
      return RecipeCatalogCard.create({
        recipeId: recipe.id,
        name: recipe.name,
        slug: recipe.slug,
        description: recipe.description,
        tags,
      })
    }

    if (listReadModel === RecipeListReadModel.AUTHOR_WORKSPACE_ITEM) {
      return RecipeAuthorWorkspaceItem.create({
        recipeId: recipe.id,
        name: recipe.name,
        slug: recipe.slug,
        status: recipe.status,
        description: recipe.description,
        tags,
      })
    }

    return RecipeSearchResultItem.create({
      recipeId: recipe.id,
      name: recipe.name,
      slug: recipe.slug,
      description: recipe.description,
      tags,
      prepTimeInMinutes: recipe.prepTimeInMinutes,
      cookTimeInMinutes: recipe.cookTimeInMinutes,
      difficultyLevel: recipe.difficultyLevel,
      author: author.userName,
    })
  }

  private resolveAuthor(recipe: Recipe) {
    const author = this.chefsRepository.items.find((chef) => {
      return chef.id.equals(recipe.authorId)
    })

    if (!author) {
      throw new Error(
        `Author with ${recipe.authorId.toString()} does not exist.`,
      )
    }

    return author
  }

  private resolveTags(recipe: Recipe) {
    return this.tagsRepository.items.filter((tag) => {
      return recipe.tagsIds.some((tagId) => tagId.equals(tag.id))
    })
  }
}

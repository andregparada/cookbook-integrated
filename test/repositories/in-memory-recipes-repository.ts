import { RecipesRepository } from '@/domain/application/repositories/recipes-repository'
import { Recipe } from '@/domain/enterprise/entities/recipe'
import { InMemoryChefsRepository } from './in-memory-chefs-repository'
import { InMemoryTagsRepository } from './in-memory-tags-repository'
import { InMemoryRecipeIngredientsRepository } from './in-memory-recipe-ingredients-repository'
import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

export class InMemoryRecipesRepository implements RecipesRepository {
  public items: Recipe[] = []

  constructor(
    private chefsRepository: InMemoryChefsRepository,
    private tagsRepository: InMemoryTagsRepository,
    private recipeIngredientsRepository: InMemoryRecipeIngredientsRepository,
  ) {}

  async findById(id: string) {
    const recipe = this.items.find((item) => item.id.toString() === id)

    if (!recipe) {
      return null
    }

    return recipe
  }

  async findDetailsBySlug(slug: string) {
    const recipe = this.items.find((item) => item.slug.value === slug)

    if (!recipe) {
      return null
    }

    const author = this.chefsRepository.items.find((chef) => {
      return chef.id.equals(recipe.authorId)
    })

    if (!author) {
      throw new Error(
        `Author with ${recipe.authorId.toString()} does not exist.`,
      )
    }

    const tags = this.tagsRepository.items.filter((tag) => {
      return recipe.tagsIds.some((tagId) => tagId.equals(tag.id))
    })

    const recipeIngredients = this.recipeIngredientsRepository.items.filter(
      (recipeIngredient) => {
        return recipe.recipeIngredientsIds.some((riId) =>
          riId.equals(recipeIngredient.id),
        )
      },
    )

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
      tags,
      recipeIngredients,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      recipeId: recipe.id,
    })
  }

  async create(recipe: Recipe) {
    this.items.push(recipe)
  }

  async save(recipe: Recipe) {
    const recipeIndex = this.items.findIndex((item) => item.id === recipe.id)

    this.items[recipeIndex] = recipe
  }
}

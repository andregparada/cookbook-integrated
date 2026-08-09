import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

export class RecipeDetailsPresenter {
  static toHTTP(recipeDetails: RecipeDetails) {
    return {
      recipeId: recipeDetails.recipeId.toString(),
      author: recipeDetails.author,
      authorId: recipeDetails.authorId.toString(),
      name: recipeDetails.name,
      slug: recipeDetails.slug.value,
      description: recipeDetails.description,
      instructions: recipeDetails.instructions,
      prepTimeInMinutes: recipeDetails.prepTimeInMinutes,
      cookTimeInMinutes: recipeDetails.cookTimeInMinutes,
      servings: recipeDetails.servings,
      difficultyLevel: recipeDetails.difficultyLevel,
      status: recipeDetails.status,
      publishedAt: recipeDetails.publishedAt,
      tags: recipeDetails.tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
      })),
      recipeIngredients: recipeDetails.recipeIngredients.map((item) => ({
        id: item.id.toString(),
        ingredientId: item.ingredientId.toString(),
        amount: item.amount,
        unit: item.unit,
      })),
      createdAt: recipeDetails.createdAt,
      updatedAt: recipeDetails.updatedAt,
    }
  }
}

import { RecipeDetails } from '@/domain/enterprise/entities/value-objects/recipe-details'

export class RecipeDetailsPresenter {
  static toHTTP(recipeDetails: RecipeDetails) {
    return {
      recipeId: recipeDetails.recipeId.toString(),
      author: recipeDetails.author,
      authorId: recipeDetails.authorId.toString(),
      name: recipeDetails.name,
      slug: recipeDetails.slug,
      description: recipeDetails.description,
      instructions: recipeDetails.instructions,
      prepTimeInMinutes: recipeDetails.prepTimeInMinutes,
      cookTimeInMinutes: recipeDetails.cookTimeInMinutes,
      servings: recipeDetails.servings,
      difficultyLevel: recipeDetails.difficultyLevel,
      tags: recipeDetails.tags,
      recipeIngredients: recipeDetails.recipeIngredients,
      createdAt: recipeDetails.createdAt,
      updatedAt: recipeDetails.updatedAt,
    }
  }
}

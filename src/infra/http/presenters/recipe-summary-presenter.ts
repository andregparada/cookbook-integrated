import { RecipeSummary } from '@/domain/enterprise/entities/value-objects/recipe-summary'

export class RecipeSummaryPresenter {
  static toHTTP(recipeSummary: RecipeSummary) {
    return {
      recipeId: recipeSummary.recipeId.toString(),
      author: recipeSummary.author,
      authorId: recipeSummary.authorId.toString(),
      name: recipeSummary.name,
      slug: recipeSummary.slug.value,
      description: recipeSummary.description,
      prepTimeInMinutes: recipeSummary.prepTimeInMinutes,
      cookTimeInMinutes: recipeSummary.cookTimeInMinutes,
      servings: recipeSummary.servings,
      difficultyLevel: recipeSummary.difficultyLevel,
      status: recipeSummary.status,
      publishedAt: recipeSummary.publishedAt,
      tags: recipeSummary.tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
      })),
      createdAt: recipeSummary.createdAt,
      updatedAt: recipeSummary.updatedAt,
    }
  }
}

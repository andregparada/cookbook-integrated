import { RecipeSearchResultItem } from '@/domain/enterprise/entities/value-objects/recipe-search-result-item'

export class RecipeSearchResultItemPresenter {
  static toHTTP(recipeSearchResultItem: RecipeSearchResultItem) {
    return {
      recipeId: recipeSearchResultItem.recipeId.toString(),
      name: recipeSearchResultItem.name,
      slug: recipeSearchResultItem.slug.value,
      description: recipeSearchResultItem.description,
      prepTimeInMinutes: recipeSearchResultItem.prepTimeInMinutes,
      cookTimeInMinutes: recipeSearchResultItem.cookTimeInMinutes,
      difficultyLevel: recipeSearchResultItem.difficultyLevel,
      author: recipeSearchResultItem.author,
      tags: recipeSearchResultItem.tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
      })),
    }
  }
}

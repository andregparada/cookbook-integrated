import { RecipeAuthorWorkspaceItem } from '@/domain/enterprise/entities/value-objects/recipe-author-workspace-item'

export class RecipeAuthorWorkspaceItemPresenter {
  static toHTTP(recipeAuthorWorkspaceItem: RecipeAuthorWorkspaceItem) {
    return {
      recipeId: recipeAuthorWorkspaceItem.recipeId.toString(),
      name: recipeAuthorWorkspaceItem.name,
      slug: recipeAuthorWorkspaceItem.slug.value,
      status: recipeAuthorWorkspaceItem.status,
      description: recipeAuthorWorkspaceItem.description,
      tags: recipeAuthorWorkspaceItem.tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
      })),
    }
  }
}

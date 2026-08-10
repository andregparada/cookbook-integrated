import { RecipeListReadModel } from '@/domain/application/search/search-recipes-params'
import { RecipeAuthorWorkspaceItem } from '@/domain/enterprise/entities/value-objects/recipe-author-workspace-item'
import { RecipeCatalogCard } from '@/domain/enterprise/entities/value-objects/recipe-catalog-card'
import { RecipeListItem } from '@/domain/enterprise/entities/value-objects/recipe-list-item'
import { RecipeSearchResultItem } from '@/domain/enterprise/entities/value-objects/recipe-search-result-item'
import { RecipeAuthorWorkspaceItemPresenter } from './recipe-author-workspace-item-presenter'
import { RecipeCatalogCardPresenter } from './recipe-catalog-card-presenter'
import { RecipeSearchResultItemPresenter } from './recipe-search-result-item-presenter'

export class RecipeListItemPresenter {
  static toHTTP(item: RecipeListItem, listReadModel: RecipeListReadModel) {
    if (listReadModel === RecipeListReadModel.CATALOG_CARD) {
      return RecipeCatalogCardPresenter.toHTTP(item as RecipeCatalogCard)
    }

    if (listReadModel === RecipeListReadModel.AUTHOR_WORKSPACE_ITEM) {
      return RecipeAuthorWorkspaceItemPresenter.toHTTP(
        item as RecipeAuthorWorkspaceItem,
      )
    }

    return RecipeSearchResultItemPresenter.toHTTP(
      item as RecipeSearchResultItem,
    )
  }
}

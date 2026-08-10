import { RecipeCatalogCard } from '@/domain/enterprise/entities/value-objects/recipe-catalog-card'
import { truncateDescriptionExcerpt } from './truncate-description-excerpt'

export class RecipeCatalogCardPresenter {
  static toHTTP(recipeCatalogCard: RecipeCatalogCard) {
    return {
      recipeId: recipeCatalogCard.recipeId.toString(),
      name: recipeCatalogCard.name,
      slug: recipeCatalogCard.slug.value,
      descriptionExcerpt: truncateDescriptionExcerpt(
        recipeCatalogCard.description,
      ),
      tags: recipeCatalogCard.tags.map((tag) => ({
        id: tag.id.toString(),
        name: tag.name,
      })),
    }
  }
}

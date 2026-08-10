import {
  RecipeSearchScope,
  hasCatalogFilters,
  IngredientMatchMode,
  normalizeCatalogFilters,
  RecipeListReadModel,
  RecipeSearchSortBy,
  resolveRecipeListReadModel,
} from './search-recipes-params'
import { DifficultyLevel } from '@/domain/enterprise/entities/recipe'

describe('SearchRecipesParams helpers', () => {
  describe('normalizeCatalogFilters', () => {
    it('should treat empty query as omitted', () => {
      const filters = normalizeCatalogFilters({
        query: '   ',
      })

      expect(filters.query).toBeUndefined()
    })

    it('should treat empty ingredient list as omitted', () => {
      const filters = normalizeCatalogFilters({
        ingredients: [],
      })

      expect(filters.ingredients).toBeUndefined()
    })

    it('should trim non-empty query', () => {
      const filters = normalizeCatalogFilters({
        query: '  bolo  ',
      })

      expect(filters.query).toBe('bolo')
    })
  })

  describe('hasCatalogFilters', () => {
    it('should return false when no catalog filters are present', () => {
      expect(hasCatalogFilters({})).toBe(false)
    })

    it('should return true when query is present', () => {
      expect(hasCatalogFilters({ query: 'bolo' })).toBe(true)
    })

    it('should return true when difficulty levels are present', () => {
      expect(
        hasCatalogFilters({ difficultyLevel: [DifficultyLevel.EASY] }),
      ).toBe(true)
    })
  })

  describe('resolveRecipeListReadModel', () => {
    it('should return catalog card for global scope without filters', () => {
      expect(resolveRecipeListReadModel(RecipeSearchScope.GLOBAL, {})).toBe(
        RecipeListReadModel.CATALOG_CARD,
      )
    })

    it('should return author workspace item for mine scope without filters', () => {
      expect(resolveRecipeListReadModel(RecipeSearchScope.MINE, {})).toBe(
        RecipeListReadModel.AUTHOR_WORKSPACE_ITEM,
      )
    })

    it('should return search result item when catalog filters are present', () => {
      expect(
        resolveRecipeListReadModel(RecipeSearchScope.GLOBAL, {
          query: 'bolo',
        }),
      ).toBe(RecipeListReadModel.SEARCH_RESULT_ITEM)

      expect(
        resolveRecipeListReadModel(RecipeSearchScope.MINE, {
          ingredients: ['tomilho'],
        }),
      ).toBe(RecipeListReadModel.SEARCH_RESULT_ITEM)
    })

    it('should not treat sortBy alone as a catalog filter', () => {
      expect(hasCatalogFilters({ sortBy: RecipeSearchSortBy.NAME_ASC })).toBe(
        false,
      )
    })

    it('should not treat ingredientMatch alone as a catalog filter', () => {
      expect(
        hasCatalogFilters({ ingredientMatch: IngredientMatchMode.ALL }),
      ).toBe(false)
    })
  })
})

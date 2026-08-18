import { IngredientMatchMode } from './search-recipes-params'

export function recipeMatchesRequiredIngredients(
  recipeIngredientIds: string[],
  requiredIds: string[],
  mode: IngredientMatchMode,
): boolean {
  if (requiredIds.length === 0) {
    return true
  }

  const recipeIngredientIdSet = new Set(recipeIngredientIds)

  if (mode === IngredientMatchMode.ANY) {
    return requiredIds.some((id) => recipeIngredientIdSet.has(id))
  }

  return requiredIds.every((id) => recipeIngredientIdSet.has(id))
}

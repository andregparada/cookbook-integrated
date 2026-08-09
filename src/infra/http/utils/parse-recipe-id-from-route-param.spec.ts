import { expect } from 'vitest'
import { parseRecipeIdFromRouteParam } from './parse-recipe-id-from-route-param'

const recipeId = '550e8400-e29b-41d4-a716-446655440000'

it('should extract id when route param is uuid only', () => {
  const result = parseRecipeIdFromRouteParam(recipeId)

  expect(result).toBe(recipeId)
})

it('should extract id when route param is uuid with correct slug', () => {
  const result = parseRecipeIdFromRouteParam(`${recipeId}-bolo-de-cenoura`)

  expect(result).toBe(recipeId)
})

it('should extract id when route param is uuid with wrong slug', () => {
  const result = parseRecipeIdFromRouteParam(`${recipeId}-slug-errado`)

  expect(result).toBe(recipeId)
})

it('should return original value when route param is not a uuid', () => {
  const result = parseRecipeIdFromRouteParam('not-a-valid-uuid')

  expect(result).toBe('not-a-valid-uuid')
})

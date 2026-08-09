import { expect } from 'vitest'
import { Slug } from './slug'

it('should be able to create a new slug from text', () => {
  const slug = Slug.createFromText('Example question title')

  expect(slug.value).toEqual('example-question-title')
})

it('should be able to create a slug from text with accents', () => {
  const slug = Slug.createFromText('Bolo de Cenoura')

  expect(slug.value).toEqual('bolo-de-cenoura')
})

import { expect } from 'vitest'
import { NormalizedName } from './normalized-name'

it('should be able to create a normalized name from text', () => {
  const normalizedName = NormalizedName.createFromText('Café da Manhã')

  expect(normalizedName.value).toEqual('cafe-da-manha')
})

it('should treat different casing as the same normalized name', () => {
  const first = NormalizedName.createFromText('Ovo')
  const second = NormalizedName.createFromText('ovo')

  expect(first.value).toEqual(second.value)
})

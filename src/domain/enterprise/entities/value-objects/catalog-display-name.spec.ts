import { expect } from 'vitest'
import { CatalogDisplayName } from './catalog-display-name'
import { InvalidCatalogDisplayNameError } from '@/domain/enterprise/errors/invalid-catalog-display-name-error'
import { NormalizedName } from './normalized-name'

it('should format compound portuguese names with lowercase particles', () => {
  const result = CatalogDisplayName.createFromText('açúcar de confeiteiro', {
    maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
  })

  expect(result.isRight()).toBe(true)
  if (result.isRight()) {
    expect(result.value.value).toBe('Açúcar de Confeiteiro')
  }
})

it('should normalize casing for simple names', () => {
  const result = CatalogDisplayName.createFromText('  TOMATE  ', {
    maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
  })

  expect(result.isRight()).toBe(true)
  if (result.isRight()) {
    expect(result.value.value).toBe('Tomate')
    expect(result.value.normalizationSource).toBe('TOMATE')
  }
})

it('should keep dedup key independent of display formatting', () => {
  const first = CatalogDisplayName.createFromText('Ovo', {
    maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
  })
  const second = CatalogDisplayName.createFromText('ovo', {
    maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
  })

  expect(first.isRight() && second.isRight()).toBe(true)
  if (first.isRight() && second.isRight()) {
    const normalizedFirst = NormalizedName.createFromText(
      first.value.normalizationSource,
    )
    const normalizedSecond = NormalizedName.createFromText(
      second.value.normalizationSource,
    )
    expect(normalizedFirst.value).toBe(normalizedSecond.value)
  }
})

it('should reject empty names', () => {
  const result = CatalogDisplayName.createFromText('   ', {
    maxLength: CatalogDisplayName.MAX_LENGTH_TAG,
  })

  expect(result.isLeft()).toBe(true)
  expect(result.value).toBeInstanceOf(InvalidCatalogDisplayNameError)
})

it('should reject names longer than max length on trimmed input', () => {
  const result = CatalogDisplayName.createFromText('a'.repeat(51), {
    maxLength: CatalogDisplayName.MAX_LENGTH_TAG,
  })

  expect(result.isLeft()).toBe(true)
})

it('should reconstitute persisted values without reformatting', () => {
  const name = CatalogDisplayName.reconstitute('legacy flour')

  expect(name.value).toBe('legacy flour')
})

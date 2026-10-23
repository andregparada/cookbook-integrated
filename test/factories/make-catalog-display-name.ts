import { CatalogDisplayName } from '@/domain/enterprise/entities/value-objects/catalog-display-name'

export function makeCatalogDisplayNameForIngredient(
  name: string | CatalogDisplayName,
): CatalogDisplayName {
  if (name instanceof CatalogDisplayName) {
    return name
  }

  const result = CatalogDisplayName.createFromText(name, {
    maxLength: CatalogDisplayName.MAX_LENGTH_INGREDIENT,
  })

  if (result.isLeft()) {
    throw new Error(result.value.message)
  }

  return result.value
}

export function makeCatalogDisplayNameForTag(
  name: string | CatalogDisplayName,
): CatalogDisplayName {
  if (name instanceof CatalogDisplayName) {
    return name
  }

  const result = CatalogDisplayName.createFromText(name, {
    maxLength: CatalogDisplayName.MAX_LENGTH_TAG,
  })

  if (result.isLeft()) {
    throw new Error(result.value.message)
  }

  return result.value
}

export interface PaginatedResultMeta {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResult<Item> {
  items: Item[]
  meta: PaginatedResultMeta
}

export function buildPaginatedResult<Item>(
  items: Item[],
  page: number,
  perPage: number,
  totalItems: number,
): PaginatedResult<Item> {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / perPage)

  return {
    items,
    meta: {
      page,
      perPage,
      totalItems,
      totalPages,
    },
  }
}

export function recipeMatchesTextQuery(
  name: string,
  description: string | null | undefined,
  query: string,
): boolean {
  const normalizedQuery = query.toLowerCase()

  if (name.toLowerCase().includes(normalizedQuery)) {
    return true
  }

  if (description === null || description === undefined) {
    return false
  }

  return description.toLowerCase().includes(normalizedQuery)
}

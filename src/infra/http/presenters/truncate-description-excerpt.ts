const DESCRIPTION_EXCERPT_MAX_LENGTH = 160

export function truncateDescriptionExcerpt(
  description: string | null,
): string | null {
  if (description === null) {
    return null
  }

  if (description.length <= DESCRIPTION_EXCERPT_MAX_LENGTH) {
    return description
  }

  return `${description.slice(0, DESCRIPTION_EXCERPT_MAX_LENGTH).trimEnd()}…`
}

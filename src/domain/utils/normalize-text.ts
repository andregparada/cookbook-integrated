/**
 * Shared text normalization algorithm (NFKD, lowercase, hyphenated).
 * Consumed by Slug (Recipe URL path) and NormalizedName (catalog dedup / query filters).
 */
export function normalizeText(text: string): string {
  const normalizedText = text
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/_/g, '-')
    .replace(/--+/g, '-')
    .replace(/-$/g, '')

  return normalizedText
}

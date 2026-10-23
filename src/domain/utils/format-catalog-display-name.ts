import { capitalize } from '@brazilian-utils/brazilian-utils'

export function formatCatalogDisplayName(text: string): string {
  return capitalize(text, { upperCaseWords: [] })
}

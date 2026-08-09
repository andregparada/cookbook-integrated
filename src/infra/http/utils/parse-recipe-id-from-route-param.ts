const UUID_WITH_OPTIONAL_SLUG_REGEX =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-(.*))?$/i

export function parseRecipeIdFromRouteParam(routeParam: string): string {
  const match = UUID_WITH_OPTIONAL_SLUG_REGEX.exec(routeParam)

  if (match) {
    return match[1]
  }

  return routeParam
}

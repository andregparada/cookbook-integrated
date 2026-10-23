# Plano: MF-29 — `CatalogDisplayName` (Ingredient / Tag)

## Contexto

- Item: Sugestão 16 (Bloco E) em `docs/regras-de-negocio.md`
- Problema: `name` de catálogo persistia como texto cru; dedup já usava `normalizedName`

## Escopo entregue

- VO `CatalogDisplayName` com `createFromText` / `reconstitute`
- Formatação composto PT-BR via `@brazilian-utils/brazilian-utils` (`capitalize`, `upperCaseWords: []`)
- Integração em `Ingredient`, `Tag`, `RecipeTagNames`, `RecipeCatalogResolver`
- Erro `InvalidCatalogDisplayNameError` → HTTP 400
- Zod em create/edit: trim + limites 100 (ingrediente) / 50 (tag)

## Fora de escopo

- Backfill de registros legados no banco
- `IngredientAlias` / sinônimos

## Critério de pronto

- Novos catálogos gravam `name` formatado; `normalizedName` inalterado
- `pnpm lint && pnpm typecheck && pnpm build && pnpm test`

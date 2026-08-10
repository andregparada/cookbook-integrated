# Plano: MF-26 — Read Models e Contrato de Busca (Sugestão 12.b)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 12.b (regras 1–8); roadmap §6 → MF-26
- Base: `docs/plans/completed/mf-25-escopos-de-consulta-da-busca.md` (`GET /recipes`, escopos, paginação)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`

## Problema

MF-25 entregou listagem com um único VO gordo (`RecipeSummary`). A 12.b exige composição AND / semântica omit-empty, contrato único `SearchRecipesParams` para 12.a–12.l, e três read models por contexto de UI.

## Escopo

**Inclui**

- VOs `RecipeCatalogCard`, `RecipeAuthorWorkspaceItem`, `RecipeSearchResultItem`
- Remoção de `RecipeSummary` + mapper/presenter associados
- Helpers: `normalizeCatalogFilters`, `hasCatalogFilters`, `resolveRecipeListReadModel`
- Tipo `SearchRecipesParams` com campos opcionais de 12.c–12.l (contrato; sem WHERE ainda)
- Presenters HTTP por contexto; excerpt de `description` no card de catálogo
- Specs unitários + ajuste e2e

**Não inclui**

- Lógica de filtro 12.c–12.l no repositório
- Query params de filtro no Zod do controller
- Modo despensa (14), perfil público (15), `coveragePercent` / `missingIngredients[]`

## Passos

1. Helpers e contrato em `src/domain/application/search/search-recipes-params.ts` (+ spec).
2. Criar três VOs em `src/domain/enterprise/entities/value-objects/`.
3. Estender port `RecipesRepository.findMany` → `PaginatedResult<RecipeListItem>` com `listReadModel`.
4. Mappers Prisma + in-memory por contexto; remover `RecipeSummary`.
5. `SearchRecipesUseCase` normaliza, resolve kind, delega ao repositório.
6. Presenters + controller escolhe shape; e2e com payloads enxutos.
7. Atualizar backlog §5/§6 em `regras-de-negocio.md`.

## Arquivos principais

- `src/domain/application/search/search-recipes-params.ts` (+ spec)
- `src/domain/enterprise/entities/value-objects/recipe-catalog-card.ts`
- `src/domain/enterprise/entities/value-objects/recipe-author-workspace-item.ts`
- `src/domain/enterprise/entities/value-objects/recipe-search-result-item.ts`
- `src/domain/application/repositories/recipes-repository.ts`
- `src/domain/application/use-cases/search-recipes.ts` (+ spec)
- `src/infra/database/prisma/mappers/prisma-recipe-list-mapper.ts`
- `src/infra/http/presenters/recipe-*-presenter.ts`
- `src/infra/http/controllers/search-recipes.controller.ts` (+ e2e)

## Testes

- Unit (helpers): empty `[]` → omit; whitespace `query` → omit; `hasCatalogFilters`; `resolveRecipeListReadModel`
- Unit (use case): shapes global/mine; busca sem filtros válida; branches 12.a preservadas
- E2E: global sem `status`/tempos/autor; `mine` com `status`; `mine` sem JWT → 401

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm test:e2e
```

## Critério de pronto

- `RecipeSummary` removido; listagens usam os três VOs conforme contexto
- Empty/omit e busca sem filtros cobertos em unit
- Contrato `SearchRecipesParams` tipado; HTTP ainda só `scope`/`page`/`perPage`
- lint, typecheck, build, unit e e2e verdes

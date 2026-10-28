---
name: add-search-filter
description: >-
  Wires one catalog search filter already declared in SearchRecipesCatalogFilters
  through Prisma where, in-memory mirror, Zod query params, and unit/e2e specs.
  Use when adding or enabling a GET /recipes filter (filtro de busca, MF-14 item
  12.x) such as excludeIngredients, tags, difficultyLevel, or sortBy. Do not use
  when adding a new use case, repository port, or HTTP route outside search
  (create-use-case) or when only scaffolding a controller without filter logic
  (create-controller-e2e).
---

# Add a search catalog filter

One filter per task. Skip steps for files already updated.

## 0. Preconditions

- The product rule is in `docs/regras-de-negocio.md`.
- The field exists on `SearchRecipesCatalogFilters` and is normalized in `normalizeCatalogFilters` / counted in `hasCatalogFilters` (`src/domain/application/use-cases/search-recipes/search-recipes-params.ts`).
- If the field is missing from the VO, stop — define the contract first (plan or code), then return to this skill.

## 1. Domain use case (only when needed)

Most filters do **not** need a new use case or port.

Change `search-recipes.ts` only when the filter adds **domain orchestration** beyond passing params to the repository — precedent: unresolved ingredient names with `ingredientMatch` (`search-recipes.ts`).

Otherwise `SearchRecipesUseCase` already forwards `catalogFilters` to `RecipesRepository.search`.

## 2. Repository `where` (Prisma)

`src/infra/database/prisma/repositories/prisma-recipes-repository.ts` — extend the search `where` for the new filter. Keep `deletedAt: null`, status/scope rules, and AND composition with existing filters.

Precedents: MF-27 (`query` substring), MF-28 (`ingredients[]` + `ingredientMatch`).

## 3. In-memory mirror

`test/repositories/in-memory-recipes-repository.ts` — apply the same filter semantics so unit specs stay honest without Prisma.

## 4. HTTP query (Zod)

`src/infra/http/controllers/search-recipes.controller.ts` — add query fields to `searchRecipesQuerySchema`, pass through to `searchRecipes.execute({ … })`.

Use the same coercion patterns as `ingredients` (string or array) when the filter is a list.

## 5. Tests

- **Unit:** extend `search-recipes.spec.ts` and/or `search-recipes-params.spec.ts` for the branch you added.
- **E2E:** happy path only in `search-recipes.controller.e2e-spec.ts` — one request proving the filter affects the result set. Do not duplicate every `Either` branch from unit specs.

## 6. Verify

Run the full gate in `AGENTS.md`, including `pnpm test:e2e` (HTTP + Prisma adapter changed).

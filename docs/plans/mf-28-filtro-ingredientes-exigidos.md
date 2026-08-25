# Plano: MF-28 — Filtro por Ingredientes Exigidos (`ingredients[]`, Sugestão 12.d)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 12.d; roadmap §6 → MF-14 derivado (após MF-27)
- Padrões: `.cursor/skills/create-use-case/SKILL.md`; HTTP: `.cursor/skills/create-controller-e2e/SKILL.md`
- Base: MF-25 (escopos + paginação), MF-26 (`SearchRecipesParams`, read models), MF-27 (`query`)

## Problema

`ingredients[]` e `ingredientMatch` já existem no contrato (`SearchRecipesParams`), mas Prisma, in-memory e Zod ignoram o filtro. Falta resolução de catálogo (ID ou `normalizedName`, sem criar), modos `ALL`/`ANY` e WHERE por presença na join `RecipeIngredient`.

## Escopo

**Inclui**

- `SearchIngredientTermsResolver`: resolve termos sem find-or-create; dedup; `hasUnresolved`
- Default `ingredientMatch=ALL`; short-circuit vazio quando aplicável
- Filtro por presença em Prisma + in-memory
- Zod: `ingredients` (string ou array) + `ingredientMatch`
- `findById` em `IngredientsRepository`
- Unit (regras 12.d) + e2e happy path / 400

**Não inclui**

- 12.e–12.l, modo despensa (14), alias/fuzzy (Sugestão 16)

## Passos

1. `findById` no port e adapters de `Ingredient`.
2. `SearchIngredientTermsResolver` + spec.
3. `recipeMatchesRequiredIngredients` helper.
4. `SearchRecipesUseCase`: resolução + short-circuit.
5. Prisma e in-memory `findMany`.
6. Zod + controller.
7. Specs unitários e e2e.
8. Atualizar roadmap §5/§6.

## Verificação (obrigatória)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

## Critério de pronto

- `ingredients[]` + `ingredientMatch` filtram por presença conforme 12.d
- Default `ALL`; não-resolvido e dedup corretos; nada criado no catálogo pela busca
- Escopo / soft-delete / `query` intactos
- lint, typecheck, build, unit e e2e verdes

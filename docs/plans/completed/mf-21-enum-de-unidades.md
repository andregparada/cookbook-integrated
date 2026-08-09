# Plano: MF-21 — Vocabulário Controlado de Unidades de Medida

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 8 (Bloco C — Conteúdo da Receita); roadmap §6 → MF-21 (item 3a)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedentes: MF-13 (mesmo bloco; padrão `getXIssues()` + erro de domínio) e MF-11 (enum Prisma + `enum-mappers.ts`)
- Escopo irmão: `position`/`note` por linha ficam para MF-22

## Problema

- `RecipeIngredient.unit` era `string` livre, permitindo inconsistências (`"cups"`, `"tbsp"`, `"colher de sopa"`).
- `amount` era obrigatório no domínio, incompatível com `TO_TASTE → amount = null`.
- Prisma aceitava `null` em ambos; o mapper lançava erro genérico ao ler `null`.

## Escopo

- Inclui: enum `MeasurementUnit` (14 valores); `amount` nullable; invariante estrita; migration com backfill; Zod `nativeEnum`; specs unitários e e2e de wiring.
- Não inclui: `position`/`note` (MF-22), conversão entre unidades, tradução/pluralização no backend, busca por unidade (MF-14).

## Passos

1. Enum `MeasurementUnit` em `recipe-ingredient.ts` + `hasValidMeasurement()`.
2. `Recipe.getIngredientMeasurementIssues()` + `InvalidRecipeIngredientMeasurementError`.
3. `RecipeCatalogResolver`, `CreateRecipeUseCase` e `EditRecipeUseCase` com validação de medida.
4. Prisma enum + migration com `USING` e fallback `Unit`; `enum-mappers.ts` + `prisma-recipe-ingredient-mapper.ts`.
5. Zod `nativeEnum` + `amount` nullable nos controllers; map de erro → 400.
6. Factories, specs unitários (incl. `TO_TASTE`) e bodies e2e.

## Arquivos principais

- `src/domain/enterprise/entities/recipe-ingredient.ts`
- `src/domain/enterprise/entities/recipe.ts`
- `src/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error.ts`
- `src/domain/application/services/recipe-catalog-resolver.ts`
- `src/domain/application/use-cases/create-recipe.ts`
- `src/domain/application/use-cases/edit-recipe.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260809212712_add_measurement_unit_enum/migration.sql`
- `src/infra/database/prisma/mappers/enum-mappers.ts`
- `src/infra/database/prisma/mappers/prisma-recipe-ingredient-mapper.ts`
- `src/infra/http/controllers/create-recipe.controller.ts`
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/http/errors/map-domain-error-to-http-exception.ts`
- `test/factories/make-recipe.ts`

## Testes

- Unit: `TO_TASTE` com `amount: null` → sucesso; `TO_TASTE` com amount → `left`; unidade normal com `amount: null` → `left`; edit com medida inválida → `left`.
- E2E: bodies com `'cup'`, `'tablespoon'`, `'teaspoon'`; assert de enum Prisma (`Cup`) no create.
- Factories: override só o que o teste asserta.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)
```

## Critério de pronto

- `unit` aceita apenas os 14 valores de `MeasurementUnit`; inválido rejeitado no Zod (400).
- `TO_TASTE` exige `amount = null`; demais unidades exigem `amount > 0`.
- Migration converte dados existentes; `unit` NOT NULL no banco.
- lint, typecheck, build, unit e e2e verdes.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

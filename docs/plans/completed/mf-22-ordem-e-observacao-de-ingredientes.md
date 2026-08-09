# Plano: MF-22 — Ordem e Observação de Ingredientes

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 9 (Bloco C — Conteúdo da Receita); roadmap §6 → MF-22 (item 3b)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedente: MF-21 (`MeasurementUnit` no mesmo agregado)

## Problema

- `RecipeIngredient` não modelava `position` nem `note` por linha.
- `compareItems` usava `ingredientId + amount + unit`, impedindo o mesmo ingrediente em duas linhas e forçando remove+create em edições.
- Repositório Prisma só fazia `createMany` + `deleteMany` — sem UPDATE de linhas existentes.

## Escopo

- Inclui: `position` (derivado do índice do payload), `note` opcional, diff por `id` na edição, caminho de UPDATE nos repositórios, Zod, presenter, specs unitários e e2e de wiring.
- Não inclui: busca por ingrediente (MF-14), conversão de unidades, tradução de `note`.

## Passos

1. `position` e `note` em `RecipeIngredient`; `compareItems` por `id`; `getUpdatedItems()` no `WatchedList`.
2. `RecipeCatalogResolver` deriva `position` do índice; preserva `id` do payload; normaliza `note`.
3. `UnknownRecipeIngredientError` + validação de ids no `EditRecipeUseCase`.
4. Migration com backfill de `position`; mapper; `updateRecipeIngredients` no `PrismaRecipesRepository`; ordenação por `position`.
5. Zod (`id` opcional no edit, `note` em ambos); map de erro → 400; presenter expõe `position`/`note`.
6. In-memory repos com `updateMany`; specs unitários e e2e de wiring.

## Arquivos principais

- `src/domain/enterprise/entities/recipe-ingredient.ts`
- `src/domain/enterprise/entities/recipe-ingredient-list.ts`
- `src/core/entities/watched-list.ts`
- `src/domain/application/services/recipe-catalog-resolver.ts`
- `src/domain/application/use-cases/edit-recipe.ts`
- `src/domain/enterprise/errors/unknown-recipe-ingredient-error.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260809220000_add_recipe_ingredient_position_and_note/migration.sql`
- `src/infra/database/prisma/mappers/prisma-recipe-ingredient-mapper.ts`
- `src/infra/database/prisma/repositories/prisma-recipes-repository.ts`
- `src/infra/http/controllers/create-recipe.controller.ts`
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/http/presenters/recipe-details-presenter.ts`
- `test/repositories/in-memory-recipe-ingredients-repository.ts`

## Testes

- Unit: `position` 0..n-1 na criação; `note` normalizada; edição preserva `id`; reordenação atualiza `position`; `id` desconhecido → `left`.
- E2E: create persiste `position`/`note`; edit preserva id da linha após UPDATE.
- Factories: override só o que o teste asserta.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm test:e2e
```

## Critério de pronto

- Cada linha tem `position` contígua (0..n-1) na ordem do payload e `note` opcional.
- Editar linha existente preserva o `id`; omitir remove; sem `id` cria.
- `id` inexistente na receita → 400.
- Leitura ordenada por `position`.
- lint, typecheck, build, unit e e2e verdes.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

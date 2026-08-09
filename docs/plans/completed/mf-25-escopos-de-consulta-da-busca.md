# Plano: MF-25 — Escopos de Consulta da Busca (Sugestão 12.a)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 12.a (Bloco D — Descoberta); roadmap §6 → MF-14 fatia 4a
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedentes: MF-11 (`RecipeStatus`, visibilidade em `GetRecipeByIdUseCase`), MF-16 (`deletedAt` filtrado no repositório), `get-recipe-by-id.controller` (`@Public()` + JWT opcional via `request.user?.sub`)

## Problema

Não existe endpoint de listagem/busca. `RecipesRepository` só expõe `findById` / `findDetailsById`. `PaginationParams` existe mas não é usado. A Sugestão 12.a exige escopos explícitos (`global` vs `mine`) com regras de visibilidade distintas, sem inferir escopo pela presença de JWT.

## Escopo

**Inclui**

- `PaginatedResult`, `PaginationParams` estendido (`page`, `perPage`, defaults 1/20, máx. 50)
- Read model `RecipeSummary` (sem `instructions` nem ingredientes)
- `RecipesRepository.findMany(SearchRecipesParams)` com escopos `GLOBAL` e `MINE`
- `SearchRecipesUseCase` + port Prisma e in-memory
- `GET /recipes` com `@Public()`, query `scope`, `page`, `perPage`
- `scope=mine` sem JWT → HTTP 401 no controller (antes do use case)
- `actorId` derivado de `request.user.sub`, nunca do query string
- Ordenação fixa `createdAt DESC`, desempate `id ASC`
- Specs unitários (todas as branches de visibilidade + paginação) e e2e de wiring

**Não inclui**

- Filtros 12.c–12.i (`query`, ingredientes, tags, dificuldade, tempo, autor)
- Ordenação parametrizada `sortBy` (12.j)
- Modo despensa (Sugestão 14) e perfil público (Sugestão 15)
- Índice composto Prisma em `(status, deletedAt, createdAt)`

## Passos

1. Estender `pagination-params.ts`; criar `paginated-result.ts`.
2. Criar VO `RecipeSummary` e `PrismaRecipeSummaryMapper`.
3. Estender port `RecipesRepository` com `RecipeSearchScope`, `SearchRecipesParams`, `findMany`.
4. Implementar `findMany` em in-memory (extrair resolução de autor/tags) e Prisma.
5. `SearchRecipesUseCase` + specs unitários (TDD).
6. `SearchRecipesController` + `RecipeSummaryPresenter` + registro em `HttpModule`.
7. E2e: happy path global, `scope=mine` com JWT, `scope=mine` sem token → 401.

## Arquivos principais

- `src/core/repositories/pagination-params.ts`, `paginated-result.ts`
- `src/domain/enterprise/entities/value-objects/recipe-summary.ts`
- `src/domain/application/repositories/recipes-repository.ts`
- `src/domain/application/use-cases/search-recipes.ts` (+ spec)
- `src/infra/database/prisma/mappers/prisma-recipe-summary-mapper.ts`
- `src/infra/database/prisma/repositories/prisma-recipes-repository.ts`
- `test/repositories/in-memory-recipes-repository.ts`
- `src/infra/http/controllers/search-recipes.controller.ts` (+ e2e)
- `src/infra/http/presenters/recipe-summary-presenter.ts`
- `src/infra/http/http.module.ts`

## Testes

- Unit: global só `PUBLISHED`; global oculta `DRAFT` do autor; soft delete em ambos escopos; `mine` com `DRAFT`+`PUBLISHED` próprios; `mine` sem `actorId` → `NotAllowedError`; paginação e `meta`.
- E2E: `[GET] /recipes` anônimo; `[GET] /recipes?scope=mine` com JWT (draft); `scope=mine` sem token → 401.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm test:e2e
```

## Critério de pronto

- Escopo global retorna só `PUBLISHED` não excluídas de todos os chefs; autenticado não altera resultado.
- `scope=mine` com JWT retorna receitas do ator (`DRAFT` + `PUBLISHED`); sem JWT → 401.
- Soft-deleted nunca aparecem em nenhum escopo.
- Resposta paginada `{ items, meta }` com defaults e limites da Sugestão 13.
- lint, typecheck, build, unit e e2e verdes.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

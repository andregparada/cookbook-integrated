# Plano: MF-27 — Busca Textual Livre (`query`, Sugestão 12.c)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 12.c; roadmap §6 → MF-14 derivado (após MF-25/26)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Base: MF-25 (escopos + paginação), MF-26 (`SearchRecipesParams`, read models)

## Problema

`query` já existe no contrato e normalização (`normalizeCatalogFilters`), mas Prisma e in-memory ignoram o filtro. O Zod do controller só aceita `scope` / `page` / `perPage`.

## Escopo

**Inclui**

- Filtro `query` em `findMany` (Prisma + in-memory): substring em `name` OR `description`, case-insensitive
- Expor `query` no Zod (máx. 100 caracteres)
- Unit specs (match name/description, case-insensitive, sem match em instructions, escopo)
- E2E happy path `?query=` + 400 para query > 100

**Não inclui**

- Filtros 12.d–12.l, full-text, fuzzy, busca em `instructions`/ingredientes

## Passos

1. Helper `recipeMatchesTextQuery` em `src/domain/application/search/`.
2. Aplicar filtro em Prisma (`contains` + `mode: 'insensitive'`) e in-memory.
3. Estender Zod e controller com `query`.
4. Specs unitários e e2e.
5. Atualizar backlog/roadmap; mover plano para `completed/`.

## Verificação (obrigatória)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test && pnpm test:e2e
```

## Critério de pronto

- `query` filtra por substring em `name` OR `description`, case-insensitive
- Escopo e soft-delete intactos
- `query` vazia omitida; >100 chars → 400
- lint, typecheck, build, unit e e2e verdes

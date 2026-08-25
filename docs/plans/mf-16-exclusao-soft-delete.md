# Plano: MF-16 — Exclusão (Soft Delete)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 5 (Bloco B); roadmap §6 → MF-16
- Padrões: `.cursor/skills/create-use-case/SKILL.md`; HTTP: `.cursor/skills/create-controller-e2e/SKILL.md`
- Precedente: MF-18 (`actorId`, ownership → `NotAllowedError`); MF-06 (map de erros)

## Problema

Não havia exclusão de receitas. Hard delete quebraria links compartilháveis e futuras referências (favoritos). Soft delete remove a receita de leitura/busca sem apagar o registro nem o catálogo global de `Ingredient`/`Tag`.

## Escopo

**Inclui**

- Campo `deletedAt: Date | null` no domínio, Prisma, mapper, factories
- `Recipe.softDelete()` (seta `deletedAt = now`, `touch`)
- `DeleteRecipeUseCase` com `actorId` (padrão MF-18)
- Filtro soft-delete em `findById` / `findDetailsById` (Prisma + in-memory)
- `DELETE /recipes/:id` (JWT, 204)
- Migration `deleted_at` nullable

**Não inclui**

- Hard delete / purge LGPD
- Undelete / restore
- Busca/listagem paginada (MF-14) — filtro nos `find*` atuais; MF-14 herdará `deletedAt IS NULL`
- Cascata em `Ingredient`/`Tag`

## Critério de pronto

- Exclusão seta `deletedAt`; registro permanece no banco
- Só o autor exclui (`NotAllowedError` / 403)
- Pós-exclusão: qualquer leitura/mutação → `ResourceNotFoundError` / 404 (inclusive autor)
- `Ingredient` e `Tag` globais intactos
- lint / typecheck / build / unit / e2e verdes

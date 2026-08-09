# Plano: MF-11 — Publicação e Status (`DRAFT` / `PUBLISHED`)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 3 (Bloco B); roadmap §6 → MF-11
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedente: MF-18 (`actorId`, ownership → `NotAllowedError`); MF-06 (map de erros)

## Problema

Hoje toda receita criada é legível por qualquer JWT via `GET /recipes/:id`, sem distinção rascunho/público. Não existem `status`, `publishedAt`, nem atos explícitos de publicar/despublicar.

## Escopo

**Inclui**

- Enum `RecipeStatus` (`DRAFT` | `PUBLISHED`) + `publishedAt` no domínio, Prisma, mapper, presenter, factories
- Create sempre nasce `DRAFT`; `publishedAt = null`
- `PublishRecipeUseCase` / `UnpublishRecipeUseCase` com `actorId` (padrão MF-18)
- Validação mínima na publicação: `name` e `instructions` não-vazios + ≥1 ingrediente → `RecipeNotPublishableError`
- Edição de receita `PUBLISHED` que cairia abaixo do mínimo → mesmo erro (não reverte status)
- Leitura: `PUBLISHED` pública; `DRAFT` só autor → senão `ResourceNotFoundError`
- `@Public()` em `GET /recipes/:id` + JWT opcional no guard
- Backfill: linhas existentes → `PUBLISHED`, `publishedAt = createdAt`

**Não inclui**

- Rascunho totalmente tolerante no Zod de create/edit — resto da Sugestão 4
- Soft delete (`deletedAt` / MF-16), busca/listagem `mine` (MF-14), rota `GET /recipes/:id-:slug` (Sugestão 6), perfil público (MF-15)

## Critério de pronto

- Toda receita nova é `DRAFT`; publish/unpublish só pelo autor
- `publishedAt` na 1ª publicação e estável em republicações
- `GET` público para `PUBLISHED`; `DRAFT` só autor (404 caso contrário)
- Conteúdo mínimo na publicação e na edição de publicadas
- lint / typecheck / build / unit / e2e verdes

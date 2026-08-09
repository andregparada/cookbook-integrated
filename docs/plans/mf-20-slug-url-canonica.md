# Plano: MF-20 — Slug estável e URL canônica (Sugestão 6)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 6 (Bloco B); roadmap §6 → MF-20
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedente: MF-11 deferiu `GET /recipes/:id-:slug`; MF-04/MF-05 estabilizaram `Slug` no agregado

## Problema

Regras 1–3 já estavam no domínio (`Slug.createFromText`, imutabilidade no edit, sem `@unique` no Prisma). Faltava a URL canônica `{id}-{slug}` e resolução por `id` ignorando slug na rota HTTP.

## Escopo

**Inclui**

- `parseRecipeIdFromRouteParam`: UUID sozinho ou `{uuid}-{slug}` → extrai UUID
- `GetRecipeByIdController` usa o parser; reutiliza `GetRecipeByIdUseCase`
- Unit: slug com acentos; edit preserva slug após rename; parser com slug certo/errado
- E2E happy path: `GET /recipes/{id}-{slug}` para `PUBLISHED`

**Não inclui**

- Unicidade global de slug / migration
- Lookup por slug puro
- Redirect 301 para slug oficial
- Busca, perfil público (MF-14/15)

## Critério de pronto

- `Slug.createFromText('Bolo de Cenoura')` → `bolo-de-cenoura`
- Edit com rename preserva slug
- `GET /recipes/{id}` e `GET /recipes/{id}-{qualquer-slug}` resolvem pelo UUID
- lint / typecheck / build / unit / e2e verdes

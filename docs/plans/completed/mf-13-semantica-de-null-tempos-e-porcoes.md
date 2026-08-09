# Plano: MF-13 — Semântica de `null` em Tempos e Porções

## Contexto

- Item do guia: `docs/regras-de-negocio.md` → Sugestão 7 (Bloco C — Conteúdo da Receita)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Escopo parcial do MF-13 original: apenas Sugestão 7; unidades (Sugestão 8) e `position`/`note` (Sugestão 9) ficam para MF-21 e MF-22

## Problema

- `Recipe.create` injeta defaults `0/0/1` quando tempos/porções são omitidos, enquanto o schema Prisma aceita `null`.
- `POST /recipes` exige os três campos; não há como criar rascunho sem tempo.
- `servings` aceita `0` no Zod, mas a regra de negócio exige `>= 1` quando informado.
- `EditRecipeUseCase` usa `??`, tornando impossível limpar um campo para "não informado".

## Escopo

- Inclui: defaults `null` na entidade; validação de faixa no domínio; `null` explícito limpa na edição; Zod `nullish` no create/edit; specs unitários; um caso e2e de wiring.
- Não inclui: enum `MeasurementUnit` (MF-21), `position`/`note` (MF-22), filtro `includeUnspecifiedTime` (MF-14), migration ou backfill.

## Passos

1. `Recipe.create`: defaults `null` para `prepTimeInMinutes`, `cookTimeInMinutes`, `servings`.
2. `getTimingAndServingsIssues()` na entidade + `InvalidRecipeTimingOrServingsError`.
3. `CreateRecipeUseCase` e `EditRecipeUseCase`: campos opcionais `number | null`; validação de faixa; edição com `!== undefined`.
4. Zod `nullish` nos controllers; `servings` com `min(1)`.
5. Specs unitários + um caso e2e de wiring.

## Arquivos principais

- `src/domain/enterprise/entities/recipe.ts`
- `src/domain/enterprise/errors/invalid-recipe-timing-or-servings-error.ts`
- `src/domain/application/use-cases/create-recipe.ts`
- `src/domain/application/use-cases/edit-recipe.ts`
- `src/infra/http/controllers/create-recipe.controller.ts`
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/http/errors/map-domain-error-to-http-exception.ts`
- `test/factories/make-recipe.ts`

## Testes

- Unit: defaults `null` no create; `0` explícito preservado; `servings: 0` rejeitado; omitido vs `null` na edição; tempo negativo rejeitado.
- E2E: body sem tempos/porções → 201 e colunas `NULL` no banco.
- Factories: override só o que o teste asserta.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)
```

## Critério de pronto

- `null` = não informado; `0` = ausência real de etapa (ex.: prato cru).
- Tempos `>= 0` e `servings >= 1` quando informados.
- Edição: omitido mantém valor; `null` limpa.
- lint, typecheck, build e testes unitários verdes; e2e quando infra mudou.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

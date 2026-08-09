# Plano: MF-24 — Limites e Semântica de Tags

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 11 (Bloco C — Conteúdo da Receita)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedentes: MF-23 (`RecipeInstructions` como VO validado + `Either` no use case), MF-13 (`!== undefined` para distinguir "omitir" de "limpar"), MF-22 (`UnknownRecipeIngredientError(issues[])` agregando issues)

## Problema

Das oito regras da Sugestão 11, quatro já estavam atendidas e quatro não:

| Regra | Estado anterior |
| :--- | :--- |
| 1. Sem `Category` | ✅ já atendido |
| 2. Tags opcionais | ⚠️ parcial — opcional no create, obrigatório no edit |
| 3. Chips canônicos sugeridos | frontend; fora de escopo |
| 4. Dedup por `normalizedName` | ⚠️ entre requisições sim; na mesma requisição duplicava ids |
| 5. Limites (máx. 10, 50 chars, rejeitar vazias) | ❌ inexistente |
| 6. Curadoria do `name` pelo primeiro cadastro | ✅ implícito; sem teste |
| 7. Omitir campo mantém tags atuais | ❌ não implementado + bug de wipe no Prisma |
| 8. Reavaliação de `Category` | decisão documental |

`PrismaRecipeMapper.toDomain` não carregava tags, então `findById` devolvia `tagsIds: []` e `save` executava `tags: { set: [] }`, apagando tags em publish/unpublish/delete.

## Escopo

**Inclui**

- VO `RecipeTagNames` com trim, rejeição de vazias, limite de 50 caracteres, dedup por `normalizedName` e limite de 10 tags
- Erro `InvalidRecipeTagsError` → HTTP 400
- `tags` opcional no edit (omitir preserva, enviar substitui, `[]` limpa)
- Hidratação de `tagsIds` em `PrismaRecipesRepository.findById`
- Specs unitários e e2e de wiring

**Não inclui**

- `.max(10)` / `.max(50)` no Zod (fonte única = domínio, precedente MF-23)
- Entidade `Category`, alias de tags, limite de 100 chars do catálogo global (Sugestão 16)
- Listagem/busca por tag (MF-14)

## Passos

1. `InvalidRecipeTagsError` e `RecipeTagNames` em `value-objects/`.
2. `RecipeCatalogResolver.resolveTagsIds` recebe o VO.
3. `CreateRecipeUseCase` e `EditRecipeUseCase` resolvem o VO; edit com `tags?: string[]`.
4. `PrismaRecipeMapper.toDomain` e `findById` hidratam `tagsIds`.
5. Zod do edit com `tags` opcional; mapper HTTP para 400.
6. Specs unitários e e2e de preservação de tags.

## Arquivos principais

- `src/domain/enterprise/entities/value-objects/recipe-tag-names.ts` (+ spec)
- `src/domain/enterprise/errors/invalid-recipe-tags-error.ts`
- `src/domain/application/services/recipe-catalog-resolver.ts`
- `src/domain/application/use-cases/create-recipe.ts` (+ spec)
- `src/domain/application/use-cases/edit-recipe.ts` (+ spec)
- `src/infra/database/prisma/mappers/prisma-recipe-mapper.ts`
- `src/infra/database/prisma/repositories/prisma-recipes-repository.ts`
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/http/errors/map-domain-error-to-http-exception.ts` (+ spec)
- `test/factories/make-recipe.ts`

## Testes

- Unit (VO): trim, vazias, 50/51 chars, dedup, máx. 10.
- Unit (create/edit): limites, dedup no payload, preservar tags ao omitir.
- Unit (mapper): `InvalidRecipeTagsError` → 400.
- E2E: edit sem `tags` preserva `_RecipeToTag`; publish preserva tags.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm test:e2e
```

## Critério de pronto

- Tag vazia, só espaços ou acima de 50 caracteres → `InvalidRecipeTagsError` → HTTP 400.
- Mais de 10 tags (após dedup) → HTTP 400.
- Omitir `tags` na edição preserva o conjunto; enviar lista substitui; `[]` limpa.
- Publicar/despublicar/excluir não apaga tags.
- lint, typecheck, build, unit e e2e verdes.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

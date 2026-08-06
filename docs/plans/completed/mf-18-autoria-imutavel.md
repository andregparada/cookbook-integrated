# Plano: MF-18 — Autoria Imutável e Derivada da Sessão

## Contexto

- Item do guia: `docs/regras-de-negocio.md` → Sugestão 2 (Bloco A — Identidade e Autoria)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedente: **MF-01** (ownership em `EditRecipeUseCase` + `NotAllowedError` → 403)

## Problema

- Não há regra explícita de que `authorId` deve ser derivado exclusivamente do JWT, nunca do payload.
- `EditRecipeUseCase` usa `authorId` no request para o ator (naming ambíguo vs `EditChefUseCase.actorId`).
- `PrismaRecipesRepository.save` inclui `authorId` no payload de update — autoria poderia ser reescrita fora da API da entidade.
- `DeleteRecipeUseCase`, `PublishRecipeUseCase` e `UnpublishRecipeUseCase` ainda não existem (MF-11 / MF-16).

## Escopo

- Inclui: rename `actorId` em edit; omitir `authorId` no Prisma `save`; testes de imutabilidade; documentação do padrão obrigatório para MF-11/MF-16.
- Não inclui: implementar delete/publish/unpublish (MF-11, MF-16).

## Passos

1. Renomear campo do ator de `authorId` → `actorId` em `EditRecipeUseCase`, controller, factory e specs.
2. Em `PrismaRecipesRepository.save`, remover `authorId` do payload de `update`.
3. Adicionar teste unitário: `authorId` permanece inalterado após edit bem-sucedido.
4. Confirmar Zod de create/edit sem `authorId`; controllers passam `user.sub`.

## Arquivos principais

- `src/domain/application/use-cases/edit-recipe.ts`
- `src/domain/application/use-cases/edit-recipe.spec.ts`
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/database/prisma/repositories/prisma-recipes-repository.ts`
- `test/factories/make-recipe.ts`

## Testes

- Unit: ownership (`NotAllowedError`) + imutabilidade de `authorId` após edit
- E2E: happy paths existentes (sem caso 403 — pirâmide)
- Factories: `makeEditRecipeUseCaseRequest` com `actorId`

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)
```

## Critério de pronto

- Edit usa `actorId`; mismatch → `NotAllowedError`.
- Create continua com `authorId` só via JWT no controller; body Zod sem o campo.
- `Recipe` sem setter; Prisma `save` não atualiza `author_id`.
- MF-11/MF-16 devem replicar o mesmo padrão de ownership ao serem implementados.
- lint, typecheck, build e testes unitários verdes; e2e quando infra mudou.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

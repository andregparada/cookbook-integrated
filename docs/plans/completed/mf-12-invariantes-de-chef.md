# Plano: MF-12 — Invariantes de Identidade do Chef

## Contexto

- Item do guia: `docs/regras-de-negocio.md` → Sugestão 1 (Bloco A — Identidade e Autoria)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Referência nest-clean (se houver): `05-nest-clean` → value objects e validação no domínio

## Problema

- `RegisterChefUseCase` valida unicidade apenas de `email`; `userName` duplicado só falha no `@unique` do Prisma (erro 500 não tratado).
- `EditChefUseCase` não verifica colisão ao trocar `email` ou `userName`.
- `ChefsRepository` não possui `findByUserName`; `findByEmail` é case-sensitive.
- Não há regra de formato nem de nomes reservados para `userName`, que será rota pública `/@userName`.
- `PrismaChefMapper` ignora `avatarId`, `createdAt` e `updatedAt`.

## Escopo

- Inclui: Value Object `UserName` com formato e nomes reservados; unicidade case-insensitive de `email` e `userName` no domínio; `findByUserName` no port; correção do mapper; testes unitários e e2e existentes.
- Não inclui: migration/citext; rota pública `/@userName` (MF-15); upload de avatar.

## Passos

1. Criar `InvalidUserNameError` e Value Object `UserName` (`Either`-based).
2. Estender `ChefsRepository` com `findByUserName`; lookups case-insensitive no Prisma e in-memory.
3. Atualizar `RegisterChefUseCase` e `EditChefUseCase` com validação e unicidade.
4. Mapear `InvalidUserNameError` → 400; ajustar Zod (`min(3).max(30)` em `userName`).
5. Corrigir `PrismaChefMapper` para `avatarId`, `createdAt`, `updatedAt`.
6. Factories de teste e specs unitários.

## Arquivos principais

- `src/domain/enterprise/entities/value-objects/user-name.ts`
- `src/domain/enterprise/errors/invalid-user-name-error.ts`
- `src/domain/application/repositories/chefs-repository.ts`
- `src/domain/application/use-cases/register-chef.ts`
- `src/domain/application/use-cases/edit-chef.ts`
- `src/infra/database/prisma/repositories/prisma-chefs-repository.ts`
- `src/infra/database/prisma/mappers/prisma-chef-mapper.ts`
- `src/infra/http/errors/map-domain-error-to-http-exception.ts`
- `test/factories/make-chef.ts`

## Testes

- Unit: `user-name.spec.ts`, `register-chef.spec.ts`, `edit-chef.spec.ts`, `authenticate-chef.spec.ts`, `map-domain-error-to-http-exception.spec.ts`
- E2E: happy path existente de `POST /accounts` e `PUT /user/me` (sem duplicar branches de use case)
- TDD: red → green nos arquivos de spec já existentes
- Factories: override só o que o teste asserta ou exercita

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)
```

## Critério de pronto

- Unicidade case-insensitive de `email` e `userName` no register e edit.
- Formato `[a-zA-Z0-9_-]{3,30}` e nomes reservados rejeitados via `UserName` VO.
- Manter o próprio `userName`/`email` permitido na edição (inclusive legados fora do formato).
- `avatarId` persistido corretamente.
- lint, typecheck, build e testes unitários verdes; e2e quando infra mudou.

## Ao concluir

1. Atualizar backlog em `docs/regras-de-negocio.md` §5 (`RegisterChefUseCase`, `PrismaChefMapper`).
2. Mover este plano para `docs/plans/completed/`.

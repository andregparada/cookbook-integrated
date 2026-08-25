# Cookbook — agent context

## Stack

NestJS 11, Prisma, PostgreSQL, Vitest, Zod, JWT, pnpm.

## Commands

From `package.json` (run from repo root):

```bash
pnpm start:dev     # API watch (port 3333)
pnpm lint          # ESLint with --fix — modifies files in place
pnpm format        # same as lint (ESLint --fix; not Prettier in isolation)
pnpm typecheck     # tsc --noEmit
pnpm build         # nest build
pnpm test          # unit (vitest)
pnpm test:e2e      # e2e (requires Postgres)
pnpm prisma migrate dev
```

**Warnings:** `pnpm lint` and `pnpm format` both run `eslint --fix` and edit files — expect working-tree changes. Formatting lives in the ESLint `prettier/prettier` rule (`@rocketseat/eslint-config/node`); there is no `.prettierrc`, so `prettier --write` would reformat to the wrong style.

Before finishing a change: `pnpm lint && pnpm typecheck && pnpm build && pnpm test` (+ `pnpm test:e2e` when HTTP, guards, pipes, or Prisma adapters changed).

## Layout

```
src/core/        # Entity, Either, errors, domain events
src/domain/      # enterprise entities, use cases, repository ports
src/infra/       # Nest modules, Prisma, JWT, HTTP controllers
```

`core` and `enterprise` do not depend on Nest or the database; the `application` layer accepts only `@Injectable()` for Nest DI composition — entities and ports stay pure. Infra connects domain rules to the chosen technologies.

## Invariants

- **`@Injectable` on use cases:** classes in `domain/application/use-cases` use `@Injectable()` for Nest DI — intentional (MF-07), aligned with nest-clean. Unit tests instantiate with `new` + in-memory repositories, no Nest container. Revisit only if runtime moves outside Nest (CLI/workers) or `domain` becomes a publishable package — then pure classes + `useFactory` in infra.
- **Ports and adapters:** `Chef`, `ChefsRepository`, `PrismaChefsRepository` (nest-clean style: `Student` + `PrismaStudentsRepository`); bind ports in `DatabaseModule` via `useClass`.
- **Persistence:** Prisma model `User` / table `users` for identity and auth; mapper translates to `Chef`.
- **Errors:** use `Either` for expected failure paths in use cases.

## References

- Foundation (completed): [docs/plans/completed/plano-melhorias-fundacao.md](docs/plans/completed/plano-melhorias-fundacao.md)
- Business rules: [docs/regras-de-negocio.md](docs/regras-de-negocio.md)
- MF-XX backlog: [docs/plans/](docs/plans/)

---
name: create-use-case
description: >-
  Creates a Cookbook application use case end-to-end: repository port, Either
  use case, in-memory and Prisma adapters, unit spec, HTTP controller and e2e.
  Use when adding or extending a use case, application action, or repository
  port, or when the user asks to create a use case (cria o use case, novo caso
  de uso) such as archive, publish, delete, or similar.
---

# Create a use case

Follow this order. Skip a step only when the artifact already exists (for example `RecipesRepository` already has `save`).

Search `src/core`, existing use cases, `test/repositories`, and `test/factories` before adding files. Extend an existing spec or factory instead of duplicating setup. Reuse the MF-01 ownership pattern: `actorId` vs `authorId` and an inline `NotAllowedError` check.

## 1. Port

If the aggregate already has a port, add methods there. Otherwise create an abstract class in `src/domain/application/repositories/` named `XxxsRepository`. Domain must not import from `src/infra`.

Example: `src/domain/application/repositories/recipes-repository.ts`.

## 2. Use case

In `src/domain/application/use-cases/`:

- `@Injectable()` on the class (MF-07 — see `AGENTS.md`)
- `execute` returns `Promise<Either<ErrorUnion, { … }>>`
- Expected failures: `left(new SomeError())`; success: `right({ … })`
- Prefer existing errors — see [error-catalog.md](references/error-catalog.md)

Canonical shape: `src/domain/application/use-cases/delete-recipe.ts`.

English, semantic names (`resolveRecipeIngredients`, `findByNormalizedName`, `actorId`). `Chef` in TypeScript; Prisma table may remain `users`. `sut` in tests is fine.

## 3. In-memory adapter

Mirror every new port method in `test/repositories/in-memory-*-repository.ts`. The in-memory class implements the same port as Prisma.

## 4. Unit spec

Same folder as the use case (`foo.spec.ts`). Instantiate with `new UseCase(inMemoryRepos)` — no Nest container.

Cover:

- Happy path
- `NotAllowedError` when the actor is not the owner (if the action is owned)
- `ResourceNotFoundError` when the target is missing
- Other `Either` branches that are real business rules

Use request factories and override only ids, the field under assertion, or the branch being exercised. See [factories.md](references/factories.md).

Adapt an existing `it` in the same `describe` before creating a new spec file. Canonical: `src/domain/application/use-cases/delete-recipe.spec.ts`.

## 5. Prisma adapter

Implement the port in `src/infra/database/prisma/repositories/prisma-*-repository.ts`. Persist aggregate graphs in a transaction here, not in loops inside the use case. Map enums in `src/infra/database/prisma/mappers/enum-mappers.ts`.

## 6. Bind the port

In `src/infra/database/database.module.ts`: `{ provide: XxxsRepository, useClass: PrismaXxxsRepository }`, and export the token.

## 7. HTTP + e2e

Register the use case in `HttpModule` `providers` and the controller in `controllers`. Then follow `.cursor/skills/create-controller-e2e/SKILL.md`.

## 8. Verify

Run the sequence in `AGENTS.md`. Include `pnpm test:e2e` when HTTP, guards, pipes, or Prisma adapters changed. Fix failures before finishing.

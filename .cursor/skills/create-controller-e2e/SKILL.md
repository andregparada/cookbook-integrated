---
name: create-controller-e2e
description: >-
  Scaffolds a Cookbook HTTP controller and its e2e spec: Nest testing module,
  ChefFactory JWT auth, Prisma factory fixtures, makeXxxHttpBody request, status
  and database assertions. Use when adding or editing a controller, HTTP route,
  or e2e spec, or when the user asks for a controller test (cria o controller,
  teste e2e, cria o e2e).
---

# Create controller + e2e

Controller handles HTTP only. Delegate to the use case. Zod pipe on input; presenter on output; `mapDomainErrorToHttpException` on `result.isLeft()`. JWT via `CurrentUser` / `UserPayload`.

Canonical controllers: `src/infra/http/controllers/delete-recipe.controller.ts` (no body) and `src/infra/http/controllers/create-recipe.controller.ts` (Zod body).

Register in `src/infra/http/http.module.ts`: controller in `controllers`, use case in `providers`.

## E2E spec

File: `src/infra/http/controllers/<name>.controller.e2e-spec.ts`.

1. Mount `Test.createTestingModule({ imports: [AppModule, DatabaseModule], providers: [ChefFactory, …Prisma factories needed] })`.
2. Authenticate: `chefFactory.makePrismaChef()` then `jwt.sign({ sub: user.id.toString() })`. Skip JWT only on public routes.
3. Seed the fixture with `ChefFactory` / `TagFactory` / `IngredientFactory` / `RecipeFactory` — never `POST` another route as setup.
4. Fire the request under test with `makeXxxHttpBody(override)` (or no body for publish/delete). Override only what the test cares about.
5. Assert HTTP status **and** the resulting row in Prisma.

Happy path only. Do not duplicate use-case branches (ownership, dedup, domain invariants) — those belong in the unit spec.

Canonical specs: `src/infra/http/controllers/create-recipe.controller.e2e-spec.ts` (HTTP body) and `src/infra/http/controllers/delete-recipe.controller.e2e-spec.ts` (seeded fixture, no body).

Factory table: `.cursor/skills/create-use-case/references/factories.md`.

## Verify

Run the sequence in `AGENTS.md`, including `pnpm test:e2e`.

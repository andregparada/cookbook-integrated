---
name: cookbook-engineering
description: >-
  Cookbook backend engineering standards — SOLID, DDD, TDD, clear English naming,
  code reuse, and test pyramid (unit for business rules, e2e for HTTP wiring).
  Use when implementing features, writing tests, refactoring, or creating MF-XX plans
  in this repository.
---

# Cookbook Engineering Standards

Read this skill when implementing or reviewing backend work in the Cookbook.

## Architecture and DDD

- Layers: `src/core` → `src/domain` → `src/infra`
- Domain has entities, use cases, and repository ports; infra has Prisma, HTTP, JWT
- Use cases orchestrate; entities hold invariants; mappers translate at the boundary
- Foundation guide: [docs/plano-melhorias-fundacao.md](../../docs/plano-melhorias-fundacao.md)
- Long-term reference: `05-nest-clean` (aggregates, `WatchedList`, `Either`, domain events)

## SOLID (applied here)

- **Single responsibility**: one use case = one application action; controllers only handle HTTP
- **Open/closed**: extend via new use cases and ports, not by bending entities for infra
- **Liskov**: Prisma and in-memory repositories honor the same port contract
- **Interface segregation**: small ports (`RecipesRepository`, `HashComparer`)
- **Dependency inversion**: domain depends on abstractions; bind in `DatabaseModule` / `HttpModule`

## Reuse before creating

- Search `src/core`, existing use cases, `test/repositories`, and `test/factories`
- Extend an existing spec or factory instead of duplicating setup
- Reuse established patterns (e.g. MF-01: `authorId` / `actorId` + inline `NotAllowedError` check)

### Test factories (`test/factories/`)

Distinguish **what** you are building:

| Helper | Use in | Example |
|--------|--------|---------|
| `makeRecipe` / `RecipeFactory` | Domain entity or Prisma seed (e2e) | recipe already in DB |
| `makeCreateRecipeUseCaseRequest` | Unit specs calling `CreateRecipeUseCase.execute` | in-memory repos, business rules |
| `makeChef` / `ChefFactory` | Chef entity or auth in e2e | JWT + persisted user |

- Do **not** inline large request objects in specs when a factory exists — use `makeXxxRequest(override)` and override only what the test cares about.
- E2E may keep a minimal inline JSON body for the HTTP happy path; business-rule variants belong in unit specs with factories.

## Scalability without over-engineering

- Ports and adapters allow swapping Prisma, adding cache or events later
- Extract bounded contexts only when a real side-effect appears (notifications, storage)
- Persist aggregate graphs in the repository (transactions), not in scattered loops inside use cases

## Naming

- English, semantic, no artificial length limits: `resolveRecipeIngredients`, `findByNormalizedName`, `actorId`
- Avoid obscure abbreviations in production code (`sut` in tests is fine)
- Stable domain vocabulary: `Chef` in TypeScript; Prisma table may remain `users`

## TDD — quality over quantity

- Red → green → refactor
- Adapt an existing `it` in the same `describe` before creating a new spec file
- Test behavior and contracts, not implementation details
- Few meaningful cases beat many trivial ones: happy path, forbidden, not found

## Test pyramid (unit vs e2e)

Follow the same split as `05-nest-clean`:

| Layer | What to test | What NOT to test |
|-------|----------------|------------------|
| **Unit (use case)** | Business rules, `Either` branches (`NotAllowedError`, `ResourceNotFoundError`), domain orchestration | HTTP status codes, JWT, Zod, Prisma wiring |
| **E2E (controller)** | Happy path: route exists, auth + validation + persistence wiring end-to-end | Business rules already covered in unit specs |

**Examples**

- Authorization (`authorId !== recipe.authorId`) → **unit only** in `edit-recipe.spec.ts`
- Ingredient/tag dedup (`Ovo` vs `ovo`) → **unit only** in `create-recipe.spec.ts`
- `PUT /recipes/:id` returns 204 and persists → **e2e only** in `edit-recipe.controller.e2e-spec.ts`
- `[POST] /recipes` returns 201 and recipe row exists → **e2e only** (one happy path; no dedup branch)

Do **not** duplicate use-case branches in e2e — including success paths for rules already covered in unit specs (dedup, ownership, validation of domain invariants).

**When e2e negative cases are justified**

- Auth guard rejects unauthenticated requests before the use case
- Controller maps specific errors to specific HTTP statuses (after MF-06)
- Middleware or pipe enforces policy outside the use case

## Pre-PR checklist

- [ ] Existing spec adapted or new cases added in the same `describe`
- [ ] Business rules covered in unit tests; e2e stays on happy-path wiring
- [ ] Clear English naming
- [ ] Reuse of existing core/domain/infra code verified
- [ ] Minimal scope — no unrelated refactors

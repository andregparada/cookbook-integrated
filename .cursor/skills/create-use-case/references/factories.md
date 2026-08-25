# Test factories (`test/factories/`)

Distinguish **what** you are building. Do not inline large request objects in specs when a factory exists — use `makeXxxRequest(override)` or `makeXxxHttpBody(override)` and override **only** what the test cares about.

`makeRecipe` / `RecipeFactory` stores `ingredients: RecipeIngredientList` (and `tagsIds`). Use-case factories store **inputs** (`tags`, `recipeIngredients`). Do not mix the two shapes in `makeRecipeScalars`.

E2E **fixture** (precondition): seed with `ChefFactory` / `TagFactory` / `IngredientFactory` / `RecipeFactory` — not `POST` to another route. E2E **request under test**: `makeCreateRecipeHttpBody` / `makeEditRecipeHttpBody` or minimal inline JSON when the body itself is the case (validation 400, login).

| Helper | Use in | Example |
|--------|--------|---------|
| `makeRecipe` / `RecipeFactory` | Domain entity or Prisma seed (e2e fixture) | recipe + tags + ingredients in DB |
| `makePublishableRecipe` / `RecipeFactory.makePrismaPublishableRecipe` | Publishable recipe fixture (unit + e2e) | tag + ingredient + valid measurement graph |
| `makeTag` / `TagFactory` | Tag entity or Prisma seed | named tag before linking to recipe |
| `makeIngredient` / `IngredientFactory` | Ingredient entity or Prisma seed | catalog row before recipe ingredient |
| `makeRecipeIngredient` | `RecipeIngredient` on `RecipeIngredientList` | unit seed or `RecipeFactory` graph |
| `makeChef` / `ChefFactory` | Chef entity or auth in e2e | JWT + persisted user |
| `makeTagsInput` / `makeRecipeIngredientsInput` | Shared list defaults for use-case request factories | override only when the test asserts tag/ingredient behavior |
| `makeCreateRecipeUseCaseRequest` | Unit specs calling `CreateRecipeUseCase.execute` | in-memory repos, business rules |
| `makeEditRecipeUseCaseRequest` | Unit specs calling `EditRecipeUseCase.execute` | in-memory repos, business rules |
| `makePublishRecipeUseCaseRequest` | Unit specs calling `PublishRecipeUseCase.execute` | `recipeId` + `actorId` |
| `makeUnpublishRecipeUseCaseRequest` | Unit specs calling `UnpublishRecipeUseCase.execute` | `recipeId` + `actorId` |
| `makeDeleteRecipeUseCaseRequest` | Unit specs calling `DeleteRecipeUseCase.execute` | `recipeId` + `actorId` |
| `makeRegisterChefUseCaseRequest` | Unit specs calling `RegisterChefUseCase.execute` | chef registration input |
| `makeEditChefUseCaseRequest` | Unit specs calling `EditChefUseCase.execute` | `actorId` + `chefId` |
| `makeCreateRecipeHttpBody` / `makeEditRecipeHttpBody` | E2E request under test (`POST` / `PUT`) | HTTP happy path only |

When adding a new use case, add `makeXxxUseCaseRequest` (and `makeXxxHttpBody` if the route has a body) next to the existing helpers in the same factory file.

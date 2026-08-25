# Domain errors

Reuse an existing class before creating a new one. New errors implement `UseCaseError` (`src/core/errors/use-case-error.ts`). Map them in `src/infra/http/errors/map-domain-error-to-http-exception.ts`.

| Class | Path | When | HTTP |
|-------|------|------|------|
| `NotAllowedError` | `src/core/errors/errors/not-allowed-error.ts` | Actor is not the owner | 403 |
| `ResourceNotFoundError` | `src/core/errors/errors/resource-not-found-error.ts` | Target entity missing (or hidden by policy, e.g. draft/soft-delete) | 404 |
| `ChefAlreadyExistsError` | `src/domain/application/use-cases/errors/chef-already-exists-error.ts` | Duplicate chef identifier (email / userName) | 409 |
| `WrongCredentialsError` | `src/domain/application/use-cases/errors/wrong-credentials-error.ts` | Invalid login | 401 |
| `InvalidUserNameError` | `src/domain/enterprise/errors/invalid-user-name-error.ts` | Chef `userName` invariant | 400 |
| `InvalidRecipeInstructionsError` | `src/domain/enterprise/errors/invalid-recipe-instructions-error.ts` | Recipe instructions invariant | 400 |
| `InvalidRecipeTagsError` | `src/domain/enterprise/errors/invalid-recipe-tags-error.ts` | Recipe tag names invariant | 400 |
| `InvalidRecipeTimingOrServingsError` | `src/domain/enterprise/errors/invalid-recipe-timing-or-servings-error.ts` | Prep/cook time or servings invariant | 400 |
| `InvalidRecipeIngredientMeasurementError` | `src/domain/enterprise/errors/invalid-recipe-ingredient-measurement-error.ts` | Ingredient amount/unit invariant | 400 |
| `UnknownRecipeIngredientError` | `src/domain/enterprise/errors/unknown-recipe-ingredient-error.ts` | Ingredient cannot be resolved | 400 |
| `RecipeNotPublishableError` | `src/domain/enterprise/errors/recipe-not-publishable-error.ts` | Publish or edit-published below minimum content | 400 |

Put generic not-found / not-allowed in `src/core/errors/errors/`. Put application-only conflicts in `src/domain/application/use-cases/errors/`. Put entity/value-object invariants in `src/domain/enterprise/errors/`.

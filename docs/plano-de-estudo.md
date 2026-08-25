# Plano de estudo — código do Cookbook

> **Objetivo:** retomar o controle do código estudando fatias verticais (controller → use case → domínio), na ordem em que o produto se monta. Não é um plano de implementação nem um substituto das [regras de negócio](regras-de-negocio.md).
>
> **Premissa:** o grosso do sistema está nas 10 rotas HTTP e nos 10 use cases. Infraestrutura (Prisma, Nest, JWT, bcrypt) entra como contrato, não como especialidade.

---

## Como estudar

Cada fatia segue o mesmo ritual:

1. **Controller** — o que entra e sai no HTTP (rota, auth, Zod, status).
2. **Use case + spec unitário** — as regras (`Either`, `NotAllowedError`, invariantes). O spec é o mapa; leia-o *junto* com o use case, não no fim.
3. **O que o use case chama** — entidade, value object ou serviço. Pare no método; não abra a árvore inteira “por precaução”.
4. **Porta do repositório** — a interface em `src/domain/application/repositories`. Prisma só se a dúvida for persistência (transação, M2M, soft delete).
5. **E2E do controller** — só o happy path: rota + auth + validação + persistência. Não relê regras já vistas no spec unitário.

Ao terminar a fatia, anote 5–10 linhas (modelo no fim deste documento) e siga. Não volte a “reestudar” uma peça compartilhada já marcada.

### Profundidade

| Nível | Quando usar | Exemplo |
|-------|-------------|---------|
| **Dominar** | A regra de negócio vive aqui | Por que `Recipe.publish()` falha; por que rascunho de outro autor vira 404 |
| **Reconhecer o contrato** | Você precisa saber o que entra/sai, não o miolo | `RecipesRepository.save`, `HashGenerator.hash` |
| **Adiar** | Não trava a compreensão da fatia | Internals do mapper Prisma, `DomainEvents`, i18n de unidades, `bcrypt` |

### Peças compartilhadas (estudar uma vez)

Na **primeira** ocorrência, estude de verdade. Nas seguintes, só reconheça.

| Peça | Primeira fatia | O que entender |
|------|----------------|----------------|
| `Either` / `left` / `right` | 1 — conta | Erro de domínio sem exception no use case |
| `UniqueEntityID`, `Entity` | 1 — conta | Identidade e props da entidade |
| `Chef`, `UserName` | 1 — conta | Invariantes do chef |
| Portas `ChefsRepository`, `HashGenerator` | 1 — conta | Domínio depende de abstração, não de Prisma/bcrypt |
| JWT, `@CurrentUser`, `@Public()` | 2 — sessão | De onde vem `sub` / `actorId`; o que é público |
| `ZodValidationPipe`, `mapDomainErrorToHttpException` | 1–2 | Validação HTTP vs erro de domínio |
| `Recipe` (AggregateRoot), `RecipeStatus`, `DifficultyLevel` | 3 — criar receita | O coração do sistema |
| `RecipeInstructions`, `RecipeTagNames`, `RecipeIngredient` / `MeasurementUnit` | 3 | Invariantes na criação |
| `RecipeIngredientList` (`WatchedList`) | 3 | Lista observada: itens novos vs removidos |
| `RecipeCatalogResolver`, `NormalizedName` | 3 | Tag/ingrediente por nome normalizado (get-or-create) |
| Porta `RecipesRepository` | 3 | `create` / `save` / `findById` / `findDetailsById` / `findMany` |
| Autoria (`actorId` vs `authorId`) | 4 — editar | Só o autor muta; `NotAllowedError` |
| `recipe.publish()` / `RecipeNotPublishableError` | 5 — publicar | Rascunho → publicada; validação estrita na publicação |
| Read model vs entidade | 6 — get by id | `RecipeDetails` + presenter ≠ `Recipe` persistida |
| Escopos e filtros de busca | 7 — search | `GLOBAL` vs `MINE`; query texto; ingredientes |

### O que este plano não pede para dominar

Olhe uma vez se aparecer; não abra sessão extra:

- Internals de `Prisma*Mapper` e `Prisma*Repository` (salvo persistência de ingrediente/tag na fatia 3)
- `HttpModule` / `DatabaseModule` / `CryptographyModule` — quem injeta o quê (Sessão 0 já basta)
- `src/core/events` (`DomainEvents`) — infra pronta, sem uso real ainda
- `src/infra/i18n`, `src/infra/env`
- Algoritmo do bcrypt / assinatura JWT

---

## Sessão 0 — mapa (não mergulhar)

Antes da primeira rota, só para saber *onde* você está. Não siga imports.

1. Camadas: `src/core` → `src/domain` → `src/infra`.
2. `src/infra/app.module.ts` e `src/infra/http/http.module.ts` — lista dos 10 controllers e 10 use cases.
3. Skim de [docs/regras-de-negocio.md](regras-de-negocio.md) seções 1–2 (visão + modelo conceitual). O detalhe das regras aparece nas fatias.
4. `prisma/schema.prisma` — nomes das tabelas e relações; não memorize colunas.

Depois disto, o código é a fonte. Os planos `docs/plans/` (MF-XX) são o *porquê histórico*; use só se uma fatia não fizer sentido.

---

## Fatias (ordem)

Há 10 controllers. Estão agrupados em 7 fatias para não quebrar o que nasce junto (conta+login, publicar+despublicar+apagar).

### Fatia 1 — criar conta

**Rota:** `POST /accounts` (pública)

Objetivo: o padrão de todo o backend (controller fino, use case, `Either`, porta) e o agregado `Chef`.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/create-account.controller.ts` |
| Use case | `src/domain/application/use-cases/register-chef.ts` |
| Spec unitário | `src/domain/application/use-cases/register-chef.spec.ts` |
| E2E | `src/infra/http/controllers/create-account.controller.e2e-spec.ts` |
| Entidade / VO | `src/domain/enterprise/entities/chef.ts`, `.../value-objects/user-name.ts` |
| Portas | `src/domain/application/repositories/chefs-repository.ts`, `src/domain/application/cryptography/hash-generator.ts` |
| HTTP compartilhado | `src/infra/auth/public.ts`, `src/infra/http/pipes/zod-validation-pipe.ts`, `src/infra/http/errors/map-domain-error-to-http-exception.ts` |
| Core | `src/core/either.ts` |

**Dominar:** e-mail/`userName` únicos; `UserName.create`; senha passa pelo `HashGenerator` (não grave senha crua).  
**Adiar:** `BcryptHasher`, Prisma chef mapper.

---

### Fatia 2 — autenticar

**Rota:** `POST /sessions` (pública) → `{ access_token }`

Objetivo: sessão JWT. A partir daqui as rotas autenticadas fazem sentido.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/authenticate.controller.ts` |
| Use case | `src/domain/application/use-cases/authenticate-chef.ts` |
| Spec unitário | `src/domain/application/use-cases/authenticate-chef.spec.ts` |
| E2E | `src/infra/http/controllers/authenticate.controller.e2e-spec.ts` |
| Portas | `HashComparer`, `Encrypter` em `src/domain/application/cryptography/` |
| Auth HTTP | `src/infra/auth/jwt.strategy.ts`, `src/infra/auth/current-user-decorator.ts`, `src/infra/auth/jwt-auth.guard.ts`, `src/infra/auth/auth.module.ts` |

**Dominar:** credencial errada → `WrongCredentialsError`; token carrega `sub` (id do chef).  
**Reconhecer:** `JwtStrategy.validate` devolve o payload; `@CurrentUser()` lê isso.  
**Adiar:** secret, Passport internals, `JwtEncrypter`.

---

### Fatia 3 — criar receita

**Rota:** `POST /recipes` (autenticada)

Objetivo: o passe mais rico. Depois desta fatia, o restante do domínio de receita fica menor. Reserve mais tempo.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/create-recipe.controller.ts` |
| Use case | `src/domain/application/use-cases/create-recipe.ts` |
| Spec unitário | `src/domain/application/use-cases/create-recipe.spec.ts` |
| E2E | `src/infra/http/controllers/create-recipe.controller.e2e-spec.ts` |
| Agregado | `src/domain/enterprise/entities/recipe.ts` |
| Ingredientes | `recipe-ingredient.ts`, `recipe-ingredient-list.ts` |
| VOs | `recipe-instructions.ts`, `recipe-tag-names.ts`, `normalized-name.ts`, `slug.ts` |
| Catálogo | `src/domain/application/services/recipe-catalog-resolver.ts` (+ spec se quiser) |
| Portas | `recipes-repository.ts`, `tags-repository.ts`, `ingredients-repository.ts` |
| Entidades catálogo | `tag.ts`, `ingredient.ts` |

**Dominar:** receita nasce `DRAFT`; `authorId` vem do JWT; instruções/tags/tempos/medições validados nos VOs; catálogo get-or-create por nome normalizado; `RecipeIngredientList`.  
**Reconhecer:** `RecipesRepository.create` persiste o grafo (receita + tags + ingredientes) — a transação está no adapter, não no use case.  
**Prisma (opcional, só se a persistência travar):** `src/infra/database/prisma/repositories/prisma-recipes-repository.ts`.  
**Adiar:** factories em `test/factories` além do que o spec já usa.

Depois desta fatia, releia em [regras-de-negocio.md](regras-de-negocio.md) o modelo de publicação (rascunho vs publicada) e as invariantes de receita. Agora o texto ancora o que você viu.

---

### Fatia 4 — editar receita

**Rota:** `PUT /recipes/:id` (autenticada)

Objetivo: o mesmo agregado, com autoria e semântica de opcionais (o que `undefined` vs `null` significa no edit).

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/edit-recipe.controller.ts` |
| Use case | `src/domain/application/use-cases/edit-recipe.ts` |
| Spec unitário | `src/domain/application/use-cases/edit-recipe.spec.ts` |
| E2E | `src/infra/http/controllers/edit-recipe.controller.e2e-spec.ts` |

**Dominar:** só o autor edita (`NotAllowedError`); `authorId` não muda; catálogo de tags/ingredientes de novo via `RecipeCatalogResolver`; diferença create vs edit no body (ingrediente pode trazer `id`).  
**Não reestudar:** `Recipe`, VOs e resolver — só o que o edit faz *diferente*.

---

### Fatia 5 — ciclo de vida (publicar, despublicar, excluir)

Três controllers curtos; o domínio está em `Recipe.publish()` / status / exclusão.

| Rota | Controller | Use case + spec |
|------|------------|-----------------|
| `POST /recipes/:id/publish` | `publish-recipe.controller.ts` | `publish-recipe.ts` + `.spec.ts` |
| `POST /recipes/:id/unpublish` | `unpublish-recipe.controller.ts` | `unpublish-recipe.ts` + `.spec.ts` |
| `DELETE /recipes/:id` | `delete-recipe.controller.ts` | `delete-recipe.ts` + `.spec.ts` |

E2E ao lado de cada controller (`*.controller.e2e-spec.ts`).

**Dominar:** só o autor; publicar exige receita “publicável” (`RecipeNotPublishableError` — o que falta: tag, ingrediente, medição, etc.); rascunho ↔ publicada; o que `delete` faz no domínio (e se o Prisma só marca `deletedAt` — aí sim abra o adapter).  
**Reconhecer:** o `try/catch` em `publish-recipe.ts` em torno de `recipe.publish()` é um desvio do padrão `Either`; anote e siga — não precisa “corrigir” enquanto estuda.

---

### Fatia 6 — obter receita por id

**Rota:** `GET /recipes/:id` (pública; JWT opcional)

Objetivo: leitura. A resposta HTTP **não** é a entidade `Recipe`.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/get-recipe-by-id.controller.ts` |
| Use case | `src/domain/application/use-cases/get-recipe-by-id.ts` |
| Spec unitário | `src/domain/application/use-cases/get-recipe-by-id.spec.ts` |
| E2E | `src/infra/http/controllers/get-recipe-by-id.controller.e2e-spec.ts` |
| Read model | `src/domain/enterprise/entities/value-objects/recipe-details.ts` |
| Presenter | `src/infra/http/presenters/recipe-details-presenter.ts` |
| Util | `src/infra/http/utils/parse-recipe-id-from-route-param.ts` |

**Dominar:** rascunho só o autor vê; qualquer outro (anônimo incluso) recebe o mesmo que “não existe” (`ResourceNotFoundError`) — não vaza existência. Publicada é pública.  
**Reconhecer:** `findDetailsById` devolve `RecipeDetails`; o presenter escolhe o JSON.  
**Adiar:** mapper Prisma de details.

---

### Fatia 7 — buscar receitas

**Rota:** `GET /recipes` (pública; `scope=mine` exige login)

Deixe por último de propósito: mais query string, mais read models, menos invariante de agregado.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/search-recipes.controller.ts` |
| Use case | `src/domain/application/use-cases/search-recipes/search-recipes.ts` |
| Params | `search-recipes-params.ts` (+ spec) |
| Spec unitário | `search-recipes.spec.ts` |
| E2E | `search-recipes.controller.e2e-spec.ts` |
| Apoio | `search-ingredient-terms-resolver.ts`, `recipe-text-query-match.ts`, `recipe-required-ingredients-match.ts` |
| Presenters | `recipe-list-item-presenter.ts`, `recipe-search-result-item-presenter.ts`, `recipe-catalog-card-presenter.ts`, `recipe-author-workspace-item-presenter.ts` |

**Dominar:** `GLOBAL` vs `MINE` (`MINE` sem JWT → 401 no controller); o que a query `query` e `ingredients` filtram; paginação (`page` / `perPage`).  
**Reconhecer:** in-memory e Prisma implementam o mesmo `findMany`; o spec unitário usa in-memory — isso *é* a regra.  
**Adiar:** SQL do Prisma, labels i18n de unidade, todos os presenters irmãos — um presenter + o VO `RecipeListItem` bastam.

---

### Fatia extra — editar chef

**Rota:** `PUT /user/me` (autenticada)

Curta; encaixe depois da fatia 2 se quiser fechar o chef, ou no fim. Não bloqueia receita.

| Papel | Arquivo |
|-------|---------|
| Controller | `src/infra/http/controllers/edit-chef.controller.ts` |
| Use case | `src/domain/application/use-cases/edit-chef.ts` |
| Spec / E2E | `edit-chef.spec.ts`, `edit-chef.controller.e2e-spec.ts` |

**Dominar:** `actorId` só edita a si; e-mail/`userName` únicos; senha opcional (rehash se vier). Mesmo padrão da fatia 4, no agregado `Chef`.

---

## Depois de create + edit (fatias 3 e 4)

Você já viu a maior parte do domínio. Vale:

1. [regras-de-negocio.md](regras-de-negocio.md) — cruzar o que o código faz com o que o produto promete.
2. Um olhar em `test/factories/` e `test/repositories/` — é o que os specs unitários usam no lugar do Nest/Prisma.
3. Só então os MF-XX em `docs/plans/` se alguma decisão (slug, soft delete, busca) ainda parecer solta.

---

## Modelo de nota (por fatia)

Copie e preencha. Cinco linhas bem feitas valem mais que um caderno.

```text
Fatia:
Rota / auth:
Use case:
Regras que o spec cobre:
Entidades / VOs tocados (primeira vez vs já vistos):
Não preciso detalhar agora:
Dúvida em aberto:
```

---

## Checklist

- [ ] Sessão 0 — mapa de camadas + `http.module.ts` + skim regras 1–2
- [ ] Fatia 1 — `POST /accounts`
- [ ] Fatia 2 — `POST /sessions` + JWT
- [ ] Fatia 3 — `POST /recipes` (bloco longo; peças compartilhadas de receita)
- [ ] Releitura das regras de publicação / invariantes de receita
- [ ] Fatia 4 — `PUT /recipes/:id`
- [ ] Fatia 5 — publish / unpublish / delete
- [ ] Fatia 6 — `GET /recipes/:id`
- [ ] Fatia 7 — `GET /recipes` (busca)
- [ ] Fatia extra — `PUT /user/me`

Quando o checklist estiver marcado, o grosso do Cookbook (HTTP + casos de uso + agregado Recipe/Chef) está recuperado. O resto é adapter.

# Cookbook — contexto para outras IAs

> **Para quem:** você, ao colar um prompt em ChatGPT, Claude, Gemini ou similar **fora do Cursor**.
> **Para quê:** a outra IA entender o produto, a stack e a arquitetura antes de opinar sobre um trecho.
>
> Fonte de verdade no repo: [regras de negócio](regras-de-negocio.md), [AGENTS.md](../AGENTS.md). Este arquivo é um **resumo portátil**, não substitui esses docs.

---

## Como usar

1. Copie da linha **COPIAR DAQUI** até **COPIAR ATÉ AQUI**.
2. Em seguida cole o [molde da pergunta](#molde-da-pergunta) preenchido, com o trecho de código.
3. Dúvida pontual (“esse mapper está certo?”): use a [versão curta](#versão-curta) no lugar do bloco longo.

Peça para a outra IA **não reinventar a stack** (não sugerir TypeORM, exceptions no use case, `authorId` no body, etc.) a menos que você peça explicitamente para questionar uma escolha.

---

## Contexto (cole isto)

<!-- COPIAR DAQUI -->

# Cookbook — contexto para outra IA

Sou o autor. Quero opinião, review ou alternativa sobre código/arquitetura.
Não peça para reescrever o projeto em outro estilo, a menos que eu peça isso.
Respeite as escolhas abaixo; se discordar, diga o trade-off e o custo de mudar, não “o certo seria…”.

## O que é

API backend de um app social de livro de receitas (estilo TudoGostoso): chefs publicam receitas e descobrem receitas de outros com **filtros combinados** (ingredientes, tempo, dificuldade, tags).

Duas fases de produto:

| Fase | Foco | Estado |
|------|------|--------|
| **1 — Catálogo público pesquisável** | Conta, CRUD de receitas, rascunho→publicada, catálogo global de ingredientes/tags, busca com filtros, perfis públicos | Em andamento |
| **2 — Interação social leve** | Favoritar, avaliar, seguir chefs, feed cronológico | Fora de escopo agora |

Projeto pessoal, privado (`UNLICENSED`). Código e identificadores em **inglês**; docs de negócio em **português**.

## Stack (não substituir)

- **NestJS 11** (HTTP, módulos, DI, JWT/Passport)
- **Prisma 6** + **PostgreSQL**
- **Zod 4** na fronteira HTTP (`ZodValidationPipe`)
- **Vitest** (unit + e2e com Supertest)
- **JWT** assimétrico (chaves RS256 em base64 no `.env`)
- **bcryptjs** para senha
- **pnpm**, TypeScript 5.7
- Path alias `@/` → `src/`
- Formatação: ESLint + `prettier/prettier` do `@rocketseat/eslint-config/node` (**não há `.prettierrc`**)

Referência de padrões: Rocketseat **nest-clean** (fórum DDD + Nest). Não copiar o fórum; alinhar agregados, ports, mappers e pirâmide de testes.

Não usamos: TypeORM, class-validator, exceptions de domínio no use case, CQRS completo, Redis, segundo bounded context, microserviços.

## Arquitetura

Clean Architecture / DDD em três pastas:

    src/core/      primitivas: Entity, AggregateRoot, UniqueEntityID, WatchedList,
                   Either, DomainEvents, PaginationParams, NotAllowedError, ResourceNotFoundError
    src/domain/    regras de negócio (puro, exceto @Injectable nos use cases)
      enterprise/  entidades, value objects, erros de invariante
      application/ use cases, ports (repositórios), services de aplicação
    src/infra/     Nest modules, Prisma, JWT, controllers, presenters, pipes, i18n

**Regra dura:** `src/domain` e `src/core` **não importam** `src/infra`. Prisma, Nest HTTP e JWT param na infra.

Fluxo de uma request:

    Controller (HTTP + Zod + JWT)
      → Use case (orquestra; retorna Either)
        → Entidade / VO (invariantes)
        → Port de repositório (interface no domain)
          → Adapter Prisma (infra)  |  In-memory (testes)
      → mapDomainErrorToHttpException  |  Presenter

Use cases são **uma ação de aplicação** cada (`CreateRecipe`, `PublishRecipe`, `SearchRecipes`, …). Estendem via use case novo, não inchando entidade para caber infra.

### Ports e adapters

- Port: classe abstrata no domain, ex. `RecipesRepository`, `ChefsRepository`, `HashComparer`.
- Prisma: `PrismaRecipesRepository`, `PrismaChefsRepository`, bound no `DatabaseModule` com `useClass`.
- Teste unitário: `InMemoryRecipesRepository` etc.; instancia o use case com `new`, **sem** container Nest.
- Mapper na fronteira Prisma ↔ domínio (`PrismaChefMapper`, `PrismaRecipeMapper`, `enum-mappers.ts`).

### Either (não exceptions no domínio)

Falhas **esperadas** (não encontrado, não autorizado, receita não publicável) retornam `left(error)`. Sucesso: `right({ … })`.

    type Response = Either<NotAllowedError | ResourceNotFoundError, { recipe: Recipe }>
    // controller: if (result.isLeft()) throw mapDomainErrorToHttpException(result.value)

`@Injectable()` nos use cases é **intencional** (decisão MF-07) para o DI do Nest. Unit tests não usam o container.

### Agregado Recipe

`Recipe` é `AggregateRoot`. Filhos:

- `RecipeIngredientList` (`WatchedList`): linhas de ingrediente com `position`, `note`, `amount`, `unit`.
- `tagsIds: UniqueEntityID[]` (N:N com catálogo global `Tag`).

O **repositório** persiste o grafo em **transação** (create/update/delete de ingredientes + set de tags). Use case não faz loop de persistência.

Catálogo global: `Ingredient` e `Tag` são entidades próprias, compartilhadas. Find-or-create por `NormalizedName` via `RecipeCatalogResolver`. Excluir receita **não** apaga tag/ingrediente global.

### Vocabulário domínio ≠ banco

| Domínio | Prisma / tabela |
|---------|-----------------|
| `Chef` | `User` / `users` |
| `prepTimeInMinutes` | `prepTime` |
| `cookTimeInMinutes` | `cookTime` |
| `hashedPassword` | `password` (nunca na API) |
| `DifficultyLevel` `easy`/`medium`/`hard` | Prisma `Easy`/`Medium`/`Hard` |
| `RecipeStatus` `draft`/`published` | Prisma `Draft`/`Published` |
| `MeasurementUnit` (enum no domínio) | Prisma `Gram`, `ToTaste`, … |
| `NormalizedName` | `normalized_name` (único; chave de dedup) |
| `Avatar` | tabela `attachments` |

Conversão de enums: só em `src/infra/database/prisma/mappers/enum-mappers.ts`.

### HTTP

Controllers **só** HTTP: validam com Zod, leem `@CurrentUser().sub`, chamam o use case, mapeiam erro ou presenter.

Rotas atuais:

| Método | Rota | Auth | Use case |
|--------|------|------|----------|
| POST | `/accounts` | público | RegisterChef |
| POST | `/sessions` | público | AuthenticateChef |
| PUT | `/user/me` | JWT | EditChef |
| POST | `/recipes` | JWT | CreateRecipe |
| PUT | `/recipes/:id` | JWT | EditRecipe |
| GET | `/recipes/:id` (também `{id}-{slug}`) | público se PUBLISHED | GetRecipeById |
| POST | `/recipes/:id/publish` | JWT (autor) | PublishRecipe |
| POST | `/recipes/:id/unpublish` | JWT (autor) | UnpublishRecipe |
| DELETE | `/recipes/:id` | JWT (autor) | DeleteRecipe (soft delete) |
| GET | `/recipes` | público no scope global; JWT se `scope=mine` | SearchRecipes |

`authorId` **nunca** vem do body: sempre `user.sub` do JWT. Autoria é imutável. Mutação exige `recipe.authorId === actorId` senão `NotAllowedError` → 403.

Presenters na infra formatam a resposta (ex.: labels pt-BR de unidade em `src/infra/i18n/measurement-units/`).

## Regras de negócio que já estão no código

- Receita nasce **DRAFT** (só o autor vê). Publicar é ato explícito → **PUBLISHED** (`publishedAt` na primeira publicação).
- Publicar exige: `name` não vazio, `instructions` não vazio, ≥ 1 ingrediente. Senão `RecipeNotPublishableError`. Rascunho pode estar incompleto.
- Soft delete: `deletedAt`; leitura e busca tratam como 404 / ausente, inclusive para o autor.
- Slug gerado no create a partir do nome; **imutável**. URL canônica `{id}-{slug}`; roteamento pelo **id**.
- Tempos e porções: `null` = não informado; `0` em tempo = etapa realmente ausente; `servings` se informado ≥ 1.
- `instructions`: texto livre, `\r\n`→`\n`, máx. 10.000 chars. Sem entidade `RecipeStep`.
- Tags: opcionais, máx. 10, máx. 50 chars, dedup por `normalizedName`. Sem entidade `Category`.
- Unidades: enum `MeasurementUnit`. Se `TO_TASTE`, `amount` deve ser `null`.
- Edição de ingredientes: payload é o **estado desejado completo** (MF-09): id existente atualiza; sem id cria; omitido remove. Omitir o campo `tags` no edit **preserva** as tags.
- Busca: `GET /recipes` com paginação (`page` default 1, `perPage` default 20, máx. 50). Escopos: `global` (PUBLISHED, anônimo ok) e `mine` (JWT, inclui DRAFT). Filtros combinam por **AND**.
- Read models de lista (não o agregado): `RecipeCatalogCard`, `RecipeAuthorWorkspaceItem`, `RecipeSearchResultItem` (união `RecipeListItem`). Detalhe de página: `RecipeDetails`.
- Implementado na busca hoje: scopes, paginação, `query` (substring em name/description, case-insensitive), `ingredients[]` + `ingredientMatch` ALL/ANY. O VO `SearchRecipesCatalogFilters` **já declara** filtros ainda não ligados no Prisma/in-memory (excludeIngredients, tags, difficulty, tempo, autor, sort, servings, pantry).

## O que ainda falta (Fase 1)

- Restante dos filtros de busca (12.e–12.l nas regras): exclude, tags, dificuldade, tempo total, autor, sort, minServings.
- Perfil público `GET /@:userName` e listagem por autor.
- Modo despensa (`pantryIngredients[]`, cobertura, `missingIngredients[]`).
- Storage de mídia (avatar/capa): `avatarId` é stub.

Fora de escopo (não sugerir): Category rígida, steps como agregado, despensa persistida, nutrição, comentários, remix, feed por engajamento, Redis, segundo bounded context.

## Testes

Pirâmide estilo nest-clean:

- **Unit (use case):** regras e branches de `Either`. Factories em `test/factories/`. Repos in-memory. Sem HTTP/JWT/Zod/Prisma.
- **E2E (controller):** happy path da rota (auth, validação, persistência). Nest testing module + `ChefFactory` JWT + factories Prisma. **Não** repetir branches do unit no e2e.

E2e negativo só quando: guard rejeita antes do use case; mapper HTTP de erro; pipe/middleware fora do use case.

## Como opinar neste repo

1. Distinga **regra de produto** (o quê) de **detalhe de infra** (como persiste).
2. Se a regra não estiver neste contexto, não invente produto — aponte a lacuna.
3. Prefira evidência (`arquivo` + invariante violado) a “está bom”.
4. Alternativa só vale se honrar: domain sem infra, Either, um use case = uma ação, mesmo contrato Prisma/in-memory, mapper na fronteira, transação no repositório do agregado.
5. Nomenclatura: `Chef` no domínio, `User` só no Prisma; `actorId` vs `authorId` (ator da sessão ≠ dono da receita).

<!-- COPIAR ATÉ AQUI -->

---

## Molde da pergunta

Cole depois do contexto:

    ## Minha pergunta

    [1–3 frases: o que quero decidir]

    ## O que espero de você

    - [ ] opinião / trade-offs
    - [ ] review do trecho
    - [ ] alternativa que caiba nesta arquitetura
    - [ ] NÃO reescrever o projeto; NÃO mudar a stack

    ## Trecho

    [cole o código, com caminho do arquivo se souber]

    ## Restrições extras desta dúvida (se houver)

    [ex.: não pode quebrar o port RecipesRepository; precisa de spec unit]

---

## Versão curta

Use no lugar do bloco longo quando a dúvida for estreita:

    Cookbook: API NestJS 11 + Prisma/Postgres + Zod + Vitest, DDD/Clean (`src/core`, `src/domain`, `src/infra`).
    Domain não importa infra. Use case retorna Either; falha esperada não é exception.
    Chef (domínio) = User (Prisma). Recipe é AggregateRoot; persistência do grafo no repositório (transação).
    JWT: authorId vem de user.sub, nunca do body. Controllers só HTTP + Zod + presenter.
    Opine dentro disso; se discordar, trade-off, não reescrita.

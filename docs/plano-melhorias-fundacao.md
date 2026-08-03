# Plano de melhorias — fundação do Cookbook

> **Objetivo deste documento:** ser um guia-mestre para criar planos de implementação menores. Cada item descreve o problema atual, onde ele está, por que vale mudar e o que fazer.  
> **Premissa:** consolidar e corrigir o que já existe **antes** de desenvolver features novas.  
> **Referência de longo prazo:** o projeto `05-nest-clean` (Rocketseat) em  
> `/home/andre/Documentos/estudo/rocketseat/Node.js/DDD e Primeiro Framework/05-nest-clean/`  
> — não se trata de copiar o fórum inteiro para cá; trata-se de alinhar padrões de domínio, agregados, repositórios e eventos à medida que o Cookbook amadurecer.

---

## Como usar este plano

1. Escolha **um item** (ou um grupo pequeno da mesma fase).
2. Crie um plano de implementação derivado (issue / chat / PR) citando o **ID** deste documento (ex.: `MF-01`).
3. Implemente e teste (unit + e2e afetados).
4. Ao concluir, siga a seção **Ao concluir um MF-XX** (fim deste documento) para atualizar o guia-mestre.

### Critério de “pronto” genérico

- Use case / repositório / mapper cobertos por teste unitário; e2e apenas no happy path da rota (ver `.cursor/skills/cookbook-engineering/SKILL.md` — pirâmide de testes).
- Nenhuma regressão nos fluxos de receita e chef já existentes.
- Nomenclatura e comportamento alinhados ao padrão descrito no item.

---

## Padrões de engenharia (obrigatório)

Todo plano derivado (MF-XX) e toda implementação devem seguir:

- **Skill:** `.cursor/skills/cookbook-engineering/SKILL.md` — SOLID, DDD, TDD, naming, reuso, escalabilidade, pirâmide de testes
- **Rule:** `.cursor/rules/cookbook-engineering.mdc` — checklist always-on
- **Subagent (opcional):** `/backend-engineer` — backend alinhado à skill acima

Ao criar um plano derivado, cite a skill no template em “Contexto”.

---

## Norte arquitetural (longo prazo)

O Cookbook hoje espelha a **base** do `05-nest-clean` (`core` + `domain` + `infra`), mas ainda em estágio anterior:

| Conceito no nest-clean | Situação no Cookbook | Direção futura |
|------------------------|----------------------|----------------|
| Bounded contexts (`forum`, `notification`) | Um único `domain/` plano | Quando houver side-effects (notificações, busca, storage), extrair contextos |
| `AggregateRoot` + `WatchedList` em `Question`/`Answer` | `Recipe` é `AggregateRoot` com `RecipeIngredientList`; tags ainda `tagsIds` | Concluído (MF-02/MF-03) |
| Repositório do agregado sincroniza `getNewItems` / `getRemovedItems` | In-memory e Prisma sincronizam ingredientes + tags M2M | Concluído (MF-03) |
| `DomainEvents.dispatchEventsForAggregate` após persistir | Infra de eventos existe, sem uso real | Ativar quando houver o primeiro subscriber útil |
| Autorização no use case (`authorId !== …`) | Parcial / ausente em edição de receita | Padronizar em todo fluxo de mutação |
| Storage, cache Redis, subscribers | Ainda não | Só depois da fundação de domínio/persistência |

**Fora do escopo deste plano (não implementar agora):** Redis, upload/storage, segundo bounded context, CQRS completo, microserviços. Eles entram em planos futuros **depois** dos itens de fundação.

---

## Fases sugeridas

| Fase | Itens | Meta |
|------|-------|------|
| **A — Correção e consistência** | MF-01, MF-04, MF-05, MF-06, MF-08, MF-09 | Comportamento correto e previsível com o modelo atual |
| **B — Domínio e persistência ricos** | MF-02, MF-03 | Agregado `Recipe` + sync + transação (padrão nest-clean) |
| **C — Higiene e decisão consciente** | MF-07, MF-08 (restante) | Código limpo e vocabulário estável |
| **D — Evolução (planos futuros)** | ver seção final | Events, contexts, storage — sob demanda |

Ordem recomendada dentro de A: **MF-01 → MF-04 → MF-05 → MF-09 → MF-06 → MF-08**.  
Depois B: **MF-02 → MF-03** (agregado primeiro, transação/sync no repositório em seguida; podem ser o mesmo PR se o escopo couber).

---

## Ordem de planos derivados (checklist)

Use esta lista ao criar novos planos de implementação:

- [x] **MF-01** Autorização em `EditRecipe` (e alinhar `EditChef`)
- [x] **MF-04** `PrismaRecipeMapper.toDomain` completo + invariantes schema
- [x] **MF-05** Normalização Tag/Ingredient (schema + repos + in-memory)
- [x] **MF-09** Semântica de opcionais no edit
- [x] **MF-06** Mapear erros de domínio → status HTTP
- [x] **MF-08** Higiene (dead code, typos, vocabulário Chef/User)
- [x] **MF-07** Registrar decisão `@Injectable` (sem refatoração, salvo mudança de meta)
- [x] **MF-02** `Recipe` AggregateRoot + `RecipeIngredientList`
- [x] **MF-03** Sync + transaction em `PrismaRecipesRepository` (+ dispatch de events quando houver subscriber)

---

## Planos futuros (após fundação) — alinhamento com nest-clean

Não detalhar implementação agora; apenas backlog consciente:

1. **Domain events reais** — ex.: `RecipeCreatedEvent` / alteração de slug → invalidar cache ou notificar; infra `src/infra/events` + subscribers em outro contexto.
2. **Bounded context** — se surgir notificação, busca ou moderação, extrair `domain/cookbook` (ou similar) e eventualmente `domain/notification`, como `forum` / `notification` no nest-clean.
3. **Storage de avatar** — porta `Uploader` no application + adaptador S3/local (nest-clean `storage`).
4. **Cache de detalhes por id** — só se `get-recipe-by-id` exigir escala (nest-clean usa Redis em detalhes; aqui a chave canônica é o id, com slug só para URL pública).
5. **Paginação** — `PaginationParams` em `src/core/repositories` já existe; usar em listagens futuras.

Cada um desses deve virar um plano próprio **somente** quando a fundação (MF-01…MF-09 / MF-02–03) estiver estável.

---

## Template para planos derivados

Ao criar um plano de implementação a partir deste guia, copie:

```markdown
# Plano: MF-XX — <título>

## Contexto
- Item do guia: `docs/plano-melhorias-fundacao.md` → MF-XX
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Referência nest-clean (se houver): <arquivo/caminho>

## Problema
- …

## Escopo
- Inclui: …
- Não inclui: …

## Passos
1. …
2. …

## Arquivos principais
- …

## Testes
- Unit: adaptar use case afetado — regras de negócio
- E2E: happy path do controller; wiring find/save (ex.: slug e `createdAt` estáveis no edit)
- TDD: red → green nos arquivos de spec já existentes
- Factories: override só o que o teste asserta ou exercita

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)
```

## Critério de pronto
- …
- lint, typecheck, build e testes unitários verdes; e2e quando infra mudou

## Ao concluir
1. Marcar o item como `[x]` no checklist de `docs/plano-melhorias-fundacao.md`.
2. Mover a seção do MF-XX para **Tarefas concluídas** no fim do guia-mestre.
3. Atualizar **Próximo passo sugerido** (logo antes de Tarefas concluídas).
4. Registrar decisão relevante em **Registro de decisões** (se houver).
```

---

## Registro de decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-07-20 | Fundação antes de features novas | Evitar construir em cima de edit/auth/mapper frágeis |
| 2026-07-20 | nest-clean como norte, não como checklist de cópia | Cookbook é outro domínio; copiar Redis/storage cedo demais gera complexidade sem demanda |
| 2026-07-20 | Manter `@Injectable` nos use cases (MF-07) | Mesmo pragmatismo da referência; custo/benefício ruim para “purificar” agora |
| 2026-07-21 | MF-01 concluído: `authorId` em `EditRecipe`, `actorId` em `EditChef` | Fechar buraco de segurança antes de MF-04/MF-09 |
| 2026-07-21 | MF-04 concluído: domínio alinhado ao schema (`description` nullable); mapper round-trip slug/datas | find/save confiável antes de MF-02/MF-09 |
| 2026-07-22 | MF-05 concluído: `Slug` só em Recipe (URL); `NormalizedName` em Tag/Ingredient; coluna `normalized_name` no Prisma | Vocabulário preciso; dedup alinhada entre domínio, in-memory e Prisma |
| 2026-07-22 | MF-09: estratégia A no PUT — `tags` e `recipeIngredients` required; escalares opcionais com `?? recipe.campo`; `[]` limpa explicitamente | Contrato previsível estilo nest-clean; omitir array não apaga silenciosamente |
| 2026-07-23 | MF-06: helper `mapDomainErrorToHttpException` com `instanceof`; sem filtro global na fundação | Contrato HTTP 404/403/401/409 alinhado ao domínio; melhoria além do nest-clean |
| 2026-07-24 | MF-08: vocabulário `Chef` em domínio/infra TS; Prisma `users`; rotas `POST /accounts` e `PUT /user/me`; `DifficultyLevel` via `enum-mappers` | Higiene e alinhamento ao nest-clean (`PrismaStudentsRepository`); sem renomear schema JWT |
| 2026-08-03 | MF-07 concluído: `@Injectable` permanece padrão em use cases | Formalizado em README/SKILL; sem refatoração na fundação |
| 2026-08-03 | MF-02: `Recipe` como `AggregateRoot` com `RecipeIngredientList`; `compareItems` por ingredientId+amount+unit; tags permanecem `tagsIds` | In-memory sync no agregado; Prisma transacional no MF-03 |
| 2026-08-03 | MF-03: `$transaction` em `PrismaRecipesRepository`; ingredientes via WatchedList diff; tags via `set` em `tagsIds`; sem `DomainEvents` até subscriber real | Integridade atômica do grafo; use cases inalterados |

---

## Ao concluir um MF-XX

Após implementar e validar um item (testes unitários + e2e afetados), a IA ou o implementador deve atualizar este guia-mestre:

1. Marcar o item como `[x]` no checklist **Ordem de planos derivados**.
2. Mover a seção completa do MF-XX (do corpo do documento) para **Tarefas concluídas**, no fim do arquivo.
3. Atualizar **Próximo passo sugerido** (logo acima de Tarefas concluídas), removendo o item fechado e apontando o próximo da fase.
4. Registrar decisão relevante em **Registro de decisões**, se houver escolha de design (ex.: nullable vs migration).

---

## Próximo passo sugerido

Fundação (MF-01…MF-09, MF-02, MF-03) concluída. Próximos itens sob demanda — ver **Planos futuros**:

1. **Domain events reais** — primeiro subscriber útil + `dispatchEventsForAggregate` no repositório
2. Features de produto (listagem com paginação, busca, favoritos) em planos próprios

## Tarefas concluídas

## MF-03 — Persistência atômica e sync no repositório do agregado

### O que estava errado / inconsistente

- `PrismaRecipesRepository.create/save` persistiam só a linha `Recipe` (sem tags/ingredients no grafo do agregado).
- Falta de transação atômica; falha no meio podia deixar dados órfãos/incompletos.

### O que foi feito

- `create`/`save` em `prisma.$transaction`: receita + `recipe_ingredients` + M2M de tags.
- Create: `createMany` de `ingredients.getItems()`; tags via `tags: { set }`.
- Save: `update` scalars + `tags: { set }`; `createMany(getNewItems())` / `deleteMany(getRemovedItems())`.
- `RecipeIngredientsRepository` mantido para `findManyByRecipeId` no edit (padrão nest-clean attachments).
- E2E create/edit assertam tags e ingredientes persistidos.
- `DomainEvents.dispatchEventsForAggregate` adiado até o primeiro subscriber real.

### Por que melhorou o projeto

Elimina estados inconsistentes no banco, torna edit previsível (replace consciente da lista) e concentra I/O Prisma no adaptador do agregado.

---

## MF-02 — `Recipe` como `AggregateRoot` com `RecipeIngredientList`

### O que estava errado / inconsistente

- `Recipe` era `Entity` com `recipeIngredientsIds`; regra de composição e sync ficava nos use cases.
- Create/edit persistiam ingredientes em loops soltos; edit não removia itens da lista.

### O que foi feito

- `RecipeIngredientList extends WatchedList<RecipeIngredient>` com `compareItems` por `ingredientId` + `amount` + `unit`.
- `Recipe extends AggregateRoot` com `ingredients: RecipeIngredientList`; removido `recipeIngredientsIds`.
- `CreateRecipeUseCase` e `EditRecipeUseCase` montam o agregado e delegam a `recipesRepository.create/save` (padrão `EditQuestionUseCase`).
- Porta `RecipeIngredientsRepository` ampliada (`findManyByRecipeId`, `createMany`, `deleteMany`); sync in-memory em `InMemoryRecipesRepository`.
- `PrismaRecipeIngredientsRepository` com métodos novos (uso pleno no MF-03).
- Specs e `makeRecipe` atualizados; caso de update amount/unit no edit.

### Por que melhorou o projeto

Agregado explícito, diff new/removed para sync, base para MF-03 (Prisma transacional) sem domain events ainda.

---

## MF-07 — Acoplamento `@Injectable()` nos use cases (decisão consciente)

### O que estava errado / inconsistente

- Use cases em `domain/application` importavam `@nestjs/common` e usavam `@Injectable()` sem decisão formal fechada no guia.
- Risco de refatoração estética (“purificar” o domínio) sem ganho real.

### O que foi feito

- Decisão documentada: manter `@Injectable()` nos 6 use cases, igual ao nest-clean.
- README (`Vocabulário e convenções`) e skill `cookbook-engineering` atualizados.
- Nenhuma refatoração de código; registro em `HttpModule` inalterado.

### Por que melhorou o projeto

Dívida consciente e alinhada à referência; evita overengineering; desacoplamento relevante permanece em ports/adapters e entidades puras.

---

## MF-08 — Higiene: dead code, typos e vocabulário

### O que estava errado / inconsistente

- Typos em arquivos (`wawtched-list`, `receipe-details`, `ingredients--`).
- Infra/HTTP misturavam `User`/`account` com domínio `Chef` (`PrismaUsersRepository`, `EditUserController`).
- `DifficultyLevel` domínio vs Prisma sem documentação explícita.
- Código comentado em `create-recipe.ts` já havia sido removido no MF-09.

### O que foi feito

- Renomeados `watched-list.ts`, `recipe-details-presenter.ts`, `in-memory-ingredients-repository.ts` e imports.
- `PrismaChefsRepository` + `CreateAccountController` / `EditChefController` (rotas `/accounts` e `/user/me` inalteradas).
- Vocabulário e `DifficultyLevel` documentados no README; typo em `register-chef.spec.ts` corrigido.

### Por que melhorou o projeto

Base legível para MF-02/MF-03; menos atrito em busca e imports; adapters TypeScript alinhados ao domínio.

---

## MF-06 — Mapeamento de erros de domínio → HTTP

### O que estava errado / inconsistente

- Controllers tratavam qualquer `result.isLeft()` com `BadRequestException` (400), inclusive not found e not allowed.
- O cliente não distinguia “receita inexistente”, “sem permissão” e “payload inválido”.
- Auth/register já mapeavam 401/409 via `switch` local, sem padrão compartilhado.

### O que foi feito

- Helper `mapDomainErrorToHttpException` em `src/infra/http/errors/` com `instanceof`:
  - `ResourceNotFoundError` → 404
  - `NotAllowedError` → 403
  - `WrongCredentialsError` → 401
  - `ChefAlreadyExistsError` → 409
  - fallback → 400
- Wire nos 6 controllers que tratam `isLeft()` (edit/get recipe, edit user, create recipe, authenticate, create account).
- Unit do helper; e2e 403/404 em edit-recipe e 404 em get-recipe-by-id.
- Sem filtro Nest global na fundação.

### Por que melhorou o projeto

Contrato HTTP claro para frontend, e2e e debugging; distinção de autorização e not found exposta na API.

---

## MF-09 — Semântica de campos opcionais no edit (partial update)

### O que estava errado / inconsistente

- Em `EditRecipeUseCase`, `tags = []` e `recipeIngredients = []` como default de desestruturação faziam omitir o campo no body ser tratado como lista vazia.
- Isso podia apagar todas as tags/ingredientes sem o cliente ter pedido.
- Os `???` no request e `recipeIngredientId?` mostravam regra de negócio não fechada.
- No nest-clean, `EditQuestion` exige arrays completos (replace explícito) — modelo PUT, não PATCH ambíguo.

### O que foi feito

- **Estratégia A (replace explícito):** `tags` e `recipeIngredients` required no Zod do PUT e no `EditRecipeUseCaseRequest`; omitir → 400 (validação).
- Escalares permanecem opcionais com `field ?? recipe.field`.
- Removidos defaults `= []`, `recipeIngredientId` do body e comentários `???`.
- Factory `makeEditRecipeUseCaseRequest` para unit specs.
- Unit: replace com arrays, `[]` limpa no domínio, escalares omitidos preservados, auth/not-found.
- E2E: happy path mantido; body sem `tags` → 400.

### Por que melhorou o projeto

Contrato HTTP previsível e edit seguro; desbloqueia MF-02/MF-03 sem surpresas de apagamento silencioso.

---

## MF-05 — Normalização de Tag / Ingredient (busca vs persistência)

### O que estava errado / inconsistente

- Use cases normalizavam o texto e chamavam `findByNormalizedName`, mas Prisma buscava por `name` e persistia o display name original.
- Tag/Ingredient usavam `Slug` no domínio para dedup — vocabulário incorreto (slug é para URL de Recipe).
- In-memory buscava por `slug.value`; Prisma por `name` normalizado — testes e produção divergiam.

### O que foi feito

- **Fase 0 (vocabulário):** VO `NormalizedName` para Tag/Ingredient; `Slug` restrito a Recipe/RecipeDetails; ports tipados com `NormalizedName`.
- **Fase 1 (persistência):** coluna `normalized_name` `@unique` no Prisma; `@unique` removido de `name`; mappers e repos Prisma buscam/gravam por `normalizedName`.
- Migration `20260722131500_add_normalized_name_to_tags_and_ingredients`.
- Testes unitários de dedup (`Ovo` / `ovo`); e2e mantém só happy path de `[POST] /recipes`.

### Por que melhorou o projeto

Catálogo limpo, contrato Liskov entre in-memory e Prisma, vocabulário alinhado ao produto (slug = URL; normalizedName = filtros em query).

---

## MF-01 — Autorização em mutações (dono do recurso)

### O que está errado / inconsistente

- `EditRecipeUseCase` recebe `authorId` e **nunca valida** se o usuário é o autor da receita. Qualquer autenticado pode editar qualquer receita.
- `EditChefUseCase` declara `NotAllowedError` no tipo de retorno, mas **não há checagem** de identidade (e o fluxo atual edita o próprio perfil via `chefId` do token — o tipo mente sobre o comportamento).
- Existe `NotAllowedError` em `src/core/errors/errors/not-allowed-error.ts`, mas o padrão de uso do nest-clean (comparar `authorId` com o dono) não foi aplicado nas receitas.

### Onde está o problema

- `src/domain/application/use-cases/edit-recipe.ts` — `execute` recebe `authorId` (request, ~L17–19) e após `findById` (~L64–68) segue direto para mutação sem comparar com `recipe.authorId`.
- `src/infra/http/controllers/edit-recipe.controller.ts` — passa `authorId: userId` (~L66–68), mas o use case ignora.
- `src/domain/application/use-cases/edit-chef.ts` — tipo inclui `NotAllowedError` (~L20–24); corpo não retorna esse erro em nenhum ramo.
- Referência correta: `05-nest-clean` → `edit-question.ts` (~L47–49): `if (authorId !== question.authorId.toString()) return left(new NotAllowedError())`.

### Por que mudar

Sem essa regra, a API é insegura e os testes de domínio não documentam a política de posse. Corrigir agora evita reescrever controllers/e2e depois que o agregado existir.

### Sugestão de implementação

1. Em `EditRecipeUseCase`, após carregar a receita:
   - se não existir → `ResourceNotFoundError`;
   - se `authorId !== recipe.authorId.toString()` → `NotAllowedError`;
   - atualizar o tipo de resposta para `Either<ResourceNotFoundError | NotAllowedError, { recipe }>`.
2. Em `EditChefUseCase`, ou validar explicitamente que o `chefId` do request é o do token (se houver dois IDs), ou remover `NotAllowedError` do tipo até existir um caso real (ex.: admin editando outro chef). Preferência: manter o tipo e validar se o controller/use case tiverem `actorId` vs `chefId`.
3. Cobrir com unit tests (cenário “outro chef tenta editar”) e e2e (403/400 conforme MF-06).

### Por que melhora o projeto

Fecha um buraco de segurança real, alinha o Cookbook ao padrão do nest-clean e deixa o contrato do use case honesto.

---

## MF-04 — Mapper de `Recipe` incompleto no `toDomain`

### O que estava errado / inconsistente

- `PrismaRecipeMapper.toDomain` não restaurava `slug`, `createdAt`, `updatedAt`, tags nem ingredientes.
- `Recipe.create` regenerava `slug` a partir do `name` e defaultava listas/tempos — ao dar `findById` + `save` no edit, o domínio podia **reescrever** slug/createdAt e perder relações na entidade em memória.
- Havia validação rígida que lançava se `description` ou `difficultyLevel` fossem `null` no Prisma, enquanto o schema permite ambos opcionais — desalinhamento domínio ↔ banco.

### O que foi feito

- `toDomain` mapeia todos os escalares persistidos, incluindo `slug`, `createdAt` e `updatedAt`.
- Domínio alinhado ao schema: `description` nullable; enum mapper trata `null`.
- Defaults de `Recipe.create` preservam `null` explícito em tempos/servings (default só em `undefined`).
- E2e de edit com assert de slug e `createdAt` estáveis após rename (wiring find/save).
- Relações (tags/ingredientes) adiadas a MF-02/MF-03.

### Por que melhorou o projeto

Remove bugs silenciosos de persistência e permite confiar no ciclo find/save.

---

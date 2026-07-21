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
3. Implemente, teste (unit + e2e afetados) e só então avance.
4. Marque o item como feito neste arquivo quando estiver estável e jogue o setor da faze sugerida feita para o fim do arquivo num setor "tarefas concluídas".
5. Altere o próximo passo sugerido no fim deste arquivo, logo antes de "tarefas concluídas".

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
| `AggregateRoot` + `WatchedList` em `Question`/`Answer` | `Recipe` é `Entity`; listas são arrays de IDs | Promover `Recipe` a agregado com listas observadas |
| Repositório do agregado sincroniza `getNewItems` / `getRemovedItems` | Create/edit gravam ingredientes em loops soltos | `RecipesRepository.save/create` orquestra o grafo |
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

## MF-02 — `Recipe` como `AggregateRoot` com `WatchedList`

### O que está errado / inconsistente

- `Recipe` estende `Entity`, não `AggregateRoot`, embora ingredientes e tags façam parte do ciclo de vida da receita.
- O agregado guarda apenas **IDs** (`tagsIds`, `recipeIngredientsIds`), não as entidades da lista — a regra de “o que entrou / saiu” fica no use case.
- `WatchedList`, `AggregateRoot` e `DomainEvents` já existem em `src/core/` (incluindo typo `wawtched-list.ts`) e **não são usados** pelo domínio de receitas — infra DDD morta.
- Os comentários `???` em `edit-recipe.ts` mostram incerteza sobre sync de ingredientes — sintoma de modelo incompleto.

### Onde está o problema

- `src/domain/enterprise/entities/recipe.ts` — `export class Recipe extends Entity<RecipeProps>`; props com `tagsIds` / `recipeIngredientsIds` (~L22–23, L100–116).
- `src/domain/application/use-cases/create-recipe.ts` e `edit-recipe.ts` — orquestram create de tags/ingredients/`RecipeIngredient` fora do agregado.
- `src/core/entities/aggregate-root.ts`, `src/core/entities/wawtched-list.ts`, `src/core/events/domain-events.ts` — prontos, sem consumidores no domínio.
- Referência: nest-clean `question.ts` (`AggregateRoot` + `QuestionAttachmentList`) e `question-attachment-list.ts`.

### Por que mudar

Enquanto a receita não for o agregado, todo edit/create vai continuar duplicando lógica, esquecendo deletes e espalhando persistência. O nest-clean mostra o caminho estável: lista observada + `update()` + repositório que aplica new/removed.

### Sugestão de implementação

1. Criar `RecipeIngredientList extends WatchedList<RecipeIngredient>` (e, se fizer sentido no mesmo passo ou no seguinte, lista de tags — tags podem permanecer como relação N:N resolvida no repositório; priorizar ingredientes, que têm amount/unit).
2. Alterar `Recipe` para `extends AggregateRoot<RecipeProps>` com `ingredients: RecipeIngredientList` (em vez de só IDs).
3. Em `EditRecipeUseCase` (espelhar `EditQuestionUseCase`):
   - carregar ingredientes atuais via `RecipeIngredientsRepository.findManyByRecipeId`;
   - montar lista, `update(novos)`, atribuir à receita;
   - `recipesRepository.save(recipe)`.
4. Corrigir o nome do arquivo `wawtched-list.ts` → `watched-list.ts` (ver MF-08) no mesmo esforço ou imediatamente antes.
5. Ainda **não** é obrigatório disparar domain events neste item — só estruturar o agregado para MF-03 e planos futuros.

### Por que melhora o projeto

Centraliza a regra de composição da receita, elimina os `???` do edit, prepara sync idempotente e deixa o domínio no mesmo patamar do nest-clean para o próximo passo de features.

---

## MF-03 — Persistência atômica e sync no repositório do agregado

### O que está errado / inconsistente

- `CreateRecipeUseCase` cria a receita e, em seguida, cada `RecipeIngredient` em um `for` com `await` separado — falha no meio deixa dados órfãos/incompletos.
- `EditRecipeUseCase` só faz `create` se o ingrediente “não existe” por id novo; **não remove** os que saíram da lista; com `RecipeIngredient.create` sempre gera **novo id**, a checagem por id quase nunca reaproveita o existente.
- `PrismaRecipesRepository.create/save` persistem só a linha `Recipe` (sem tags/ingredients no grafo do agregado).

### Onde está o problema

- `src/domain/application/use-cases/create-recipe.ts` (~L86–90) — loop de `recipeIngredientsRepository.create`.
- `src/domain/application/use-cases/edit-recipe.ts` (~L88–99, L124–157) — sync incompleto; comentários `???`.
- `src/infra/database/prisma/repositories/prisma-recipes-repository.ts` (~L47–64) — `create`/`save` apenas `prisma.recipe`.
- Referência: nest-clean `prisma-questions-repository.ts` `create`/`save` — `createMany` / `deleteMany` com `getNewItems()` / `getRemovedItems()`, e `DomainEvents.dispatchEventsForAggregate` após persistir.

### Por que mudar

Integridade referencial e previsibilidade de edit são pré-requisitos para qualquer feature em cima de receitas (busca, favoritos, versões). Transação e sync no adaptador Prisma mantêm o domínio limpo.

### Sugestão de implementação

1. Dependendo de MF-02: `PrismaRecipesRepository.create/save` devem:
   - persistir a receita;
   - `createMany` nos `ingredients.getNewItems()` (e connect de tags, se aplicável);
   - `deleteMany` nos `getRemovedItems()`;
   - preferir `prisma.$transaction` (ou `Promise.all` apenas se a atomicidade for garantida de outra forma — **preferir transaction** no Cookbook).
2. Remover do use case a responsabilidade de chamar `recipeIngredientsRepository.create` item a item; o use case só monta o agregado e chama `save`/`create`.
3. Manter `RecipeIngredientsRepository` para queries auxiliares (`findManyByRecipeId`), como no nest-clean com attachments.
4. Quando houver o primeiro evento de domínio útil, disparar `DomainEvents.dispatchEventsForAggregate(recipe.id)` **depois** do commit (padrão nest-clean).

### Por que melhora o projeto

Elimina estados inconsistentes no banco, torna edit previsível (replace consciente da lista) e concentra I/O Prisma no lugar certo.

---

## MF-04 — Mapper de `Recipe` incompleto no `toDomain`

### O que está errado / inconsistente

- `PrismaRecipeMapper.toDomain` não restaura `slug`, `createdAt`, `updatedAt`, tags nem ingredientes.
- `Recipe.create` regenera `slug` a partir do `name` e defaulta listas/tempos — ao dar `findById` + `save` no edit, o domínio pode **reescrever** slug/createdAt e perder relações na entidade em memória.
- Há validação rígida que lança se `description` ou `difficultyLevel` forem `null` no Prisma, enquanto o schema Prisma permite `description String?` e `difficultyLevel DifficultyLevel?` — desalinhamento domínio ↔ banco.

### Onde está o problema

- `src/infra/database/prisma/mappers/prisma-recipe-mapper.ts` — `toDomain` (~L10–27): não passa `slug`, `createdAt`; não mapeia relações.
- `src/domain/enterprise/entities/recipe.ts` — `create` defaults (~L146–152).
- `prisma/schema.prisma` — `Recipe.description` / `difficultyLevel` opcionais (~L46–51) vs mapper que exige non-null.

### Por que mudar

Qualquer use case que faça load → mutate → save depende de um `toDomain` fiel. Hoje o edit já está em terreno movediço.

### Sugestão de implementação

1. `toDomain` deve mapear **todos** os campos escalares persistidos: `id`, `authorId`, `name`, `slug` (`Slug.create(raw.slug)`), `description`, `instructions`, tempos, `servings`, `difficultyLevel`, `createdAt`, `updatedAt`.
2. Decidir invariantes: ou o domínio aceita `description`/`difficulty` nullable (como o schema), ou a migration/schema exige NOT NULL — **uma fonte da verdade**.
3. Relações (ingredients/tags): ou o `findById` do repositório hidrata listas (include + mapper), ou o use case carrega via repositório de ingredientes (padrão nest-clean). Documentar a escolha no plano derivado de MF-02/MF-03.
4. Teste unitário do mapper: round-trip `toPrisma` ↔ `toDomain` preserva slug e datas.

### Por que melhora o projeto

Remove bugs silenciosos de persistência e permite confiar no ciclo find/save.

---

## MF-05 — Normalização de Tag / Ingredient (busca vs persistência)

### O que está errado / inconsistente

- Use cases normalizam o texto (`normalizeText`) e chamam `findByNormalizedName`.
- `PrismaTagsRepository` / `PrismaIngredientsRepository` buscam `where: { name: normalizedName }`.
- Na criação, `Tag.create` / `Ingredient.create` gravam o **nome original** (e slug derivado); o unique no Prisma é em `name`, não em um campo normalizado.
- Repositórios in-memory buscam por `item.slug.value` — **comportamento diferente** do Prisma → testes unitários podem passar e produção falhar (ou o contrário).

### Onde está o problema

- `src/domain/application/use-cases/create-recipe.ts` / `edit-recipe.ts` — `resolveTagsIds` / `resolveRecipeIngredients` + `normalizeText`.
- `src/infra/database/prisma/repositories/prisma-tags-repository.ts` (~L11–15).
- `src/infra/database/prisma/repositories/prisma-ingredients-repository.ts` (mesmo padrão).
- `test/repositories/in-memory-tags-repository.ts` e `test/repositories/in-memory-ingredients--repository.ts` — busca por slug.
- `prisma/schema.prisma` — `Tag.name` / `Ingredient.name` `@unique`, sem coluna `slug`/`normalizedName` nas tabelas Tag/Ingredient (embora a entidade de domínio tenha `slug`).

### Por que mudar

Deduplicação de tags/ingredientes é regra de negócio central do create/edit. Se a busca não bate com o que foi salvo, o sistema cria duplicatas (“Ovo” vs “ovo”).

### Sugestão de implementação

1. **Alinhar contrato:** persistir e buscar pelo mesmo identificador canônico.
   - Opção A (próxima do domínio atual): adicionar `slug` (ou `normalizedName`) no schema Prisma com `@unique`; `findByNormalizedName` filtra por esse campo; `name` fica display.
   - Opção B: na criação, persistir `name` já normalizado (pior UX de display).
2. Preferir **Opção A**.
3. Fazer in-memory e Prisma usarem a **mesma** regra (slug/normalized).
4. Ajustar mappers `PrismaTagMapper` / `PrismaIngredientMapper`.
5. Migration + testes cobrindo “Ovo” e “ovo” resolvem para o mesmo registro.

### Por que melhora o projeto

Garante catálogo limpo, testes fiéis à produção e remove uma armadilha clássica domínio vs ORM.

---

## MF-06 — Mapeamento de erros de domínio → HTTP

### O que está errado / inconsistente

- Controllers tratam qualquer `result.isLeft()` com `BadRequestException` (400), inclusive not found e (futuramente) not allowed.
- O cliente não distingue “receita inexistente”, “sem permissão” e “payload inválido”.
- O próprio nest-clean, em vários controllers, ainda usa `BadRequestException` genérico — aqui o Cookbook pode **melhorar além da referência** sem fugir da arquitetura.

### Onde está o problema

- `src/infra/http/controllers/edit-recipe.controller.ts` (~L80–82).
- `src/infra/http/controllers/create-recipe.controller.ts` (~L66–68).
- Demais controllers de mutação/leitura que repetem o padrão (`edit-user`, `authenticate`, `get-recipe-by-slug`, etc.).
- Erros de domínio: `src/core/errors/errors/resource-not-found-error.ts`, `not-allowed-error.ts`, `src/domain/application/use-cases/errors/*`.

### Por que mudar

Contrato HTTP claro facilita frontend, e2e e debugging. Com MF-01, se NotAllowed continuar como 400, a autorização “funciona” no domínio mas some na API.

### Sugestão de implementação

1. Nos controllers (ou num helper/presenter de erro), mapear por `instanceof`:
   - `ResourceNotFoundError` → `NotFoundException` (404)
   - `NotAllowedError` → `ForbiddenException` (403)
   - `WrongCredentialsError` → `UnauthorizedException` (401)
   - `ChefAlreadyExistsError` → `ConflictException` (409)
   - fallback → `BadRequestException` (400)
2. Opcional: filtro Nest global de exceções depois — não é obrigatório na fundação.
3. Atualizar e2e para assertir status codes.

### Por que melhora o projeto

API mais profissional e alinhada ao significado dos erros que o domínio já modela com `Either`.

---

## MF-07 — Acoplamento `@Injectable()` nos use cases (decisão consciente)

### O que está errado / inconsistente

- Use cases no `domain/application` importam `@nestjs/common` e usam `@Injectable()`.
- Isso acopla a camada de aplicação ao framework. Funciona e é o mesmo pragmatismo do nest-clean — **não é bug**, mas é uma decisão que deve ficar explícita.

### Onde está o problema

- Todos os use cases sob `src/domain/application/use-cases/*.ts` (ex.: `create-recipe.ts` L1, L40; `edit-recipe.ts`; `authenticate-chef.ts`; etc.).
- Registro em `src/infra/http/http.module.ts` como `providers`.

### Por que mudar (ou documentar)

Se a meta de longo prazo for domínio 100% livre de Nest, o custo de refatorar depois cresce com o número de use cases. Se a meta for pragmatismo igual ao nest-clean, documentar evita debates repetidos.

### Sugestão de implementação

**Recomendação para o Cookbook (fundação):** manter `@Injectable()` nos use cases, **igual ao nest-clean**, e registrar esta decisão aqui como padrão do projeto.

Só replanejar remoção do decorator se no futuro houver:

- execução dos use cases fora do Nest (CLI, workers sem DI Nest), ou
- pacote de domínio publicado separadamente.

Se um dia remover: classes puras no domain + `useClass` / factory no `HttpModule`.

### Por que melhora o projeto

Evita refatoração estética agora; deixa a dívida (se houver) consciente e alinhada à referência de longo prazo.

---

## MF-08 — Higiene: dead code, typos e vocabulário

### O que está errado / inconsistente

- Bloco enorme de código comentado no final de `create-recipe.ts` (~L150–299).
- Typo no core: `src/core/entities/wawtched-list.ts` (também herdado do material Rocketseat).
- Typo no presenter: `src/infra/http/presenters/receipe-details-presenter.ts` (“receipe”).
- Vocabulário misto **Chef** (domínio) vs **User** (Prisma/`edit-user.controller`/`PrismaUsersRepository`) vs “account” nos controllers de registro.
- `DifficultyLevel` no domínio (`easy` / `medium` / `hard`) vs Prisma (`Easy` / `Medium` / `Hard`) — mitigado por `enum-mappers.ts`, mas aumenta carga cognitiva.
- Nome de arquivo de teste: `test/repositories/in-memory-ingredients--repository.ts` (dois hífens).

### Onde está o problema

Arquivos citados acima; binding em `src/infra/database/database.module.ts` (`ChefsRepository` → `PrismaUsersRepository`); rotas/controllers `edit-user`, `create-account`.

### Por que mudar

Higiene reduz atrito em todo PR futuro. Vocabulário único evita “qual repositório eu importo?”. Typos quebram busca e imports.

### Sugestão de implementação

1. Apagar código comentado em `create-recipe.ts` (histórico fica no git).
2. Renomear `wawtched-list.ts` → `watched-list.ts` e atualizar imports/specs.
3. Renomear presenter `receipe-*` → `recipe-*`.
4. **Decisão de vocabulário (escolher uma e aplicar):**
   - **Opção recomendada:** domínio e application usam `Chef`; infra Prisma mantém tabela `users` (legado/OK) mas classes de infra preferem `PrismaChefsRepository` + mapper já `PrismaChefMapper`; HTTP pode expor `/chefs` ou manter `/accounts` com documentação — o importante é nomes de classes/arquivos no TypeScript.
   - Alternativa: renomear domínio para `User` (mais trabalho, alinhado ao schema).
5. Documentar o mapeamento de `DifficultyLevel` numa linha no README ou neste doc; não é obrigatório unificar enums Prisma/domínio na fundação se o mapper estiver testado.
6. Corrigir `in-memory-ingredients--repository.ts`.

### Por que melhora o projeto

Base legível para os próximos planos; menos surpresa ao navegar o código.

---

## MF-09 — Semântica de campos opcionais no edit (partial update)

### O que está errado / inconsistente

- Em `EditRecipeUseCase`, `tags = []` e `recipeIngredients = []` como **default de desestruturação** fazem com que **omitir** o campo no body seja tratado como “lista vazia”.
- Isso pode **apagar** todas as tags/ingredientes sem o cliente ter pedido.
- Os `???` no próprio request (`name?: string`, `recipeIngredientId?: string`) mostram regra de negócio não fechada.
- No nest-clean, `EditQuestion` exige `title`, `content` e `attachmentsIds` completos (replace explícito da lista de attachments) — modelo “PUT full replace” de campos mandatórios, não PATCH parcial ambíguo.

### Onde está o problema

- `src/domain/application/use-cases/edit-recipe.ts` (~L17–33, L52–62 defaults, L84–86).
- `src/infra/http/controllers/edit-recipe.controller.ts` — schema Zod com tudo `.optional()` (~L16–34).

### Por que mudar

Comportamento de API ambíguo gera bugs difíceis de reproduzir e conflita com a expectativa de “editar só o que mandei”.

### Sugestão de implementação

Escolher **um** contrato e documentar:

| Estratégia | Comportamento | Quando usar |
|------------|---------------|-------------|
| **A — Replace explícito (estilo nest-clean)** | Body sempre envia campos principais + arrays completos; omitir array não é permitido (ou é required) | API simples, frontend controla estado completo |
| **B — PATCH semântico** | `undefined` = não altera; `[]` = limpa; array com itens = substitui | API parcial flexível |

**Recomendação fundação:** começar com **A** para `tags` e `recipeIngredients` (required no Zod no PUT), e campos escalares podem permanecer opcionais com `?? recipe.campo` **sem** default `[]` na desestruturação.

Implementação mínima:

1. Remover `= []` dos defaults de `tags` / `recipeIngredients`.
2. Se `tags === undefined`, não chamar `resolveTagsIds` nem atribuir `recipe.tagsIds`.
3. Se `recipeIngredients === undefined`, não mexer na lista de ingredientes.
4. Se enviados, fazer replace completo via WatchedList (MF-02/MF-03).
5. Atualizar e2e/unit para cobrir “omitir tags não apaga”.

### Por que melhora o projeto

Contrato HTTP previsível e edit seguro; desbloqueia MF-02/MF-03 sem surpresas.

---

## Ordem de planos derivados (checklist)

Use esta lista ao criar novos planos de implementação:

- [x] **MF-01** Autorização em `EditRecipe` (e alinhar `EditChef`)
- [ ] **MF-04** `PrismaRecipeMapper.toDomain` completo + invariantes schema
- [ ] **MF-05** Normalização Tag/Ingredient (schema + repos + in-memory)
- [ ] **MF-09** Semântica de opcionais no edit
- [ ] **MF-06** Mapear erros de domínio → status HTTP
- [ ] **MF-08** Higiene (dead code, typos, vocabulário Chef/User)
- [ ] **MF-07** Registrar decisão `@Injectable` (sem refatoração, salvo mudança de meta)
- [ ] **MF-02** `Recipe` AggregateRoot + `RecipeIngredientList`
- [ ] **MF-03** Sync + transaction em `PrismaRecipesRepository` (+ dispatch de events quando houver subscriber)

---

## Planos futuros (após fundação) — alinhamento com nest-clean

Não detalhar implementação agora; apenas backlog consciente:

1. **Domain events reais** — ex.: `RecipeCreatedEvent` / alteração de slug → invalidar cache ou notificar; infra `src/infra/events` + subscribers em outro contexto.
2. **Bounded context** — se surgir notificação, busca ou moderação, extrair `domain/cookbook` (ou similar) e eventualmente `domain/notification`, como `forum` / `notification` no nest-clean.
3. **Storage de avatar** — porta `Uploader` no application + adaptador S3/local (nest-clean `storage`).
4. **Cache de detalhes por slug** — só se `get-recipe-by-slug` exigir escala (nest-clean usa Redis em `findDetailsBySlug`).
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
- Unit: …
- E2E: …

## Critério de pronto
- …
```

---

## Registro de decisões

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-07-20 | Fundação antes de features novas | Evitar construir em cima de edit/auth/mapper frágeis |
| 2026-07-20 | nest-clean como norte, não como checklist de cópia | Cookbook é outro domínio; copiar Redis/storage cedo demais gera complexidade sem demanda |
| 2026-07-20 | Manter `@Injectable` nos use cases (MF-07) | Mesmo pragmatismo da referência; custo/benefício ruim para “purificar” agora |
| 2026-07-21 | MF-01 concluído: `authorId` em `EditRecipe`, `actorId` em `EditChef` | Fechar buraco de segurança antes de MF-04/MF-09 |
| 2026-07-21 | Skill + rule `cookbook-engineering` | Padronizar SOLID/DDD/TDD e pirâmide de testes em todo trabalho no repo |

---

## Próximo passo sugerido

Com MF-01 fechado, a ordem recomendada da **Fase A** continua:

1. **MF-04** — `PrismaRecipeMapper.toDomain` completo (find/save confiável após edit)
2. **MF-05** — normalização Tag/Ingredient alinhada entre Prisma e in-memory
3. **MF-09** — semântica de opcionais no edit (evitar apagar tags/ingredientes ao omitir campos)
4. **MF-06** — mapear `NotAllowedError` → 403 e demais erros de domínio para status HTTP corretos

Depois disso, avançar para **MF-02** e **MF-03** (agregado `Recipe` + sync transacional no repositório).

## Tarefas concluídas

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

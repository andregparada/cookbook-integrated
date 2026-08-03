# Cookbook

API de um aplicativo pessoal para **armazenar, pesquisar e, no futuro, trocar receitas**.

Nasceu da necessidade do próprio criador: um lugar confiável para guardar receitas e encontrá-las depois com **filtros bem específicos** — por ingredientes, tempo, dificuldade, tags e outros critérios que importam na cozinha do dia a dia. Quando essa base estiver sólida e a experiência de busca for boa o suficiente, o produto pode evoluir para uma **rede de chefs amadores**: pessoas compartilhando o que cozinham, descobertas e adaptações.

## Visão em duas fases

| Fase | Foco | Sucesso |
|------|------|---------|
| **1 — Caderno pessoal** | Conta, CRUD de receitas, catálogo de ingredientes/tags, busca com filtros | O criador (e depois outros usuários) usa o app no lugar de anotações soltas |
| **2 — Rede de chefs amadores** | Compartilhamento, descoberta social, perfis | Troca de receitas entre amadores, sem perder a qualidade da busca |

## O que já existe hoje

- Cadastro e autenticação de chefs (JWT)
- Criação e edição de receitas (nome, descrição, instruções, tempos, porções, dificuldade)
- Associação com **tags** e **ingredientes** (quantidade + unidade)
- Consulta de receita por **id** (slug permanece no payload para URLs públicas no estilo `{id}-{slug}`)
- Persistência em PostgreSQL via Prisma
- Testes unitários (Vitest + repositórios in-memory) e e2e

## Stack

- **NestJS** — HTTP, módulos, autenticação
- **Prisma** + **PostgreSQL**
- **Zod** — validação de entrada
- **Vitest** — testes
- Arquitetura em camadas inspirada em **Clean Architecture / DDD**: `src/core`, `src/domain`, `src/infra`

## Estrutura do código

```
src/
  core/       # Primitivas compartilhadas (Entity, Either, erros, eventos)
  domain/     # Regras de negócio (entidades, casos de uso, ports)
  infra/      # Nest, Prisma, JWT, controllers HTTP
```

`core` e `enterprise` não dependem do Nest nem do banco; a camada `application` aceita apenas o decorator `@Injectable()` para composição no container Nest; entidades e ports permanecem puros. A infra conecta essas regras às tecnologias escolhidas.

### Vocabulário e convenções

- **`@Injectable` nos use cases:** classes em `domain/application/use-cases` usam `@Injectable()` para DI do Nest — decisão intencional (MF-07), alinhada ao nest-clean. Testes unitários instanciam com `new` + repositórios in-memory, sem container Nest. Reavaliar só se surgir runtime fora do Nest (CLI/workers) ou pacote `domain` publicável — aí: classes puras + `useFactory` na infra.
- **Domínio e TypeScript (ports/adapters):** `Chef`, `ChefsRepository`, `PrismaChefsRepository` — alinhado ao nest-clean (`Student` + `PrismaStudentsRepository`); binding de ports em `DatabaseModule` via `useClass`.
- **Persistência:** modelo Prisma `User` / tabela `users` (identidade e auth); o mapper traduz para `Chef`.
- **HTTP público:** `POST /accounts` (`CreateAccountController` → `RegisterChefUseCase`) e `PUT /user/me` (`EditChefController`); JWT usa `CurrentUser` / `UserPayload` (convenção Nest).
- **`DifficultyLevel`:** domínio `easy` | `medium` | `hard`; Prisma `Easy` | `Medium` | `Hard` — conversão em `src/infra/database/prisma/mappers/enum-mappers.ts`.

## Pré-requisitos

- Node.js (LTS recomendado)
- [pnpm](https://pnpm.io/)
- Docker (para o Postgres local)

## Configuração

1. Suba o banco:

```bash
docker compose up -d
```

2. Crie um `.env` na raiz com pelo menos:

```env
DATABASE_URL="postgresql://postgres:docker@localhost:5432/nest-clean?schema=public"
JWT_PRIVATE_KEY="..."   # chave privada em base64
JWT_PUBLIC_KEY="..."    # chave pública em base64
PORT=3333
```

3. Instale dependências e rode as migrations:

```bash
pnpm install
pnpm prisma migrate dev
```

## Scripts

```bash
pnpm start:dev      # API em modo watch (porta 3333 por padrão)
pnpm test           # testes unitários
pnpm test:e2e       # testes end-to-end
pnpm lint           # ESLint
pnpm build          # build de produção
```

Há também um `client.http` na raiz para experimentar endpoints manualmente.

## Roadmap (alto nível)

1. Consolidar a fundação (autorização, agregado de receita, busca/filtros, consistência de persistência) — ver o [plano de melhorias](docs/plano-melhorias-fundacao.md) e a [análise de regras de negócio](docs/analise-regras-negocio.md)
2. Entregar uma **pesquisa com filtros** à altura do uso pessoal diário
3. Só então investir em compartilhamento e rede social leve entre chefs amadores

## Licença

Projeto privado / uso pessoal (`UNLICENSED`).

# Cookbook

API de um aplicativo social de livro de receitas para **publicar, descobrir e pesquisar receitas** com filtros combinados — no estilo TudoGostoso.

Usuários cadastram receitas (inicialmente como rascunho, publicando quando prontas) e descobrem receitas de outros com **filtros bem específicos** — por ingredientes, tempo, dificuldade, tags e outros critérios. Na Fase 2, o produto evolui com interação social leve: favoritar, avaliar, seguir chefs e feed cronológico.

## Visão em duas fases

| Fase | Foco | Sucesso |
|------|------|---------|
| **1 — Catálogo público pesquisável** | Conta, CRUD de receitas, publicação (rascunho → publicada), catálogo de ingredientes/tags, busca global com filtros, perfis públicos | Usuários publicam receitas e encontram receitas de outros com filtros precisos |
| **2 — Interação entre usuários** | Favoritar, avaliar, seguir chefs, feed cronológico | Descoberta social leve sem perder a qualidade da busca |

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

1. Fundação concluída (autorização, agregado de receita, consistência de persistência) — ver o [plano de melhorias](docs/plans/completed/plano-melhorias-fundacao.md)
2. Publicação de receitas (rascunho → publicada) e **busca global com filtros** — ver [regras de negócio](docs/regras-de-negocio.md)
3. Perfis públicos e descoberta por autor
4. Interação social leve (favoritar, avaliar, seguir, feed)

## Licença

Projeto privado / uso pessoal (`UNLICENSED`).

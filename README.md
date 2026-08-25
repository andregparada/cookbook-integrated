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
- Consulta de receita por **id** ou URL canônica `{id}-{slug}` (resolução por id; slug é legibilidade/SEO)
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

Convenções de código e invariantes de arquitetura: [AGENTS.md](AGENTS.md).

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

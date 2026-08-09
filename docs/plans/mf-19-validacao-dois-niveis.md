# Plano: MF-19 — Validação em dois níveis (resto da Sugestão 4)

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 4 (Bloco B); roadmap §6 → MF-19
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedente: MF-11 (publish strict + edit-published guard; excluiu rascunho tolerante no Zod)

## Problema

O domínio já separa persistência tolerante (DRAFT) de validação estrita (publicação), mas `POST /recipes` ainda exigia `description` e `recipeIngredients` no Zod, impedindo salvar rascunhos incompletos pela API. Faltava cobertura unitária explícita para create incompleto e publish/edit por campo faltante.

## Escopo

**Inclui**

- `description` opcional no Zod de create → `null` no use case
- `recipeIngredients` opcional no Zod de create (default `[]` no use case)
- `CreateRecipeUseCaseRequest` com `description: string | null` e `recipeIngredients?`
- Unit: create com name/instructions vazios e zero ingredientes; publish com instructions vazias + mensagem; edit PUBLISHED limpando name/instructions

**Não inclui**

- Semântica `null` em tempos/porções (MF-13 / Sugestão 7)
- Reabrir entity publishability, mapper HTTP ou controllers de publish/unpublish
- E2e negativo de publish 400

## Critério de pronto

- Create HTTP aceita draft sem `description` e sem `recipeIngredients` (ou lista vazia)
- Domínio continua rejeitando publish/edit-published incompletos com `RecipeNotPublishableError` descritivo
- Unit cobre create incompleto + publish/edit por campo; e2e só wiring happy path
- lint / typecheck / build / unit / e2e verdes

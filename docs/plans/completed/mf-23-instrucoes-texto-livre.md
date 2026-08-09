# Plano: MF-23 — Instruções em Texto Livre

## Contexto

- Item: `docs/regras-de-negocio.md` → Sugestão 10 (Bloco C — Conteúdo da Receita)
- Padrões: `.cursor/skills/cookbook-engineering/SKILL.md`
- Precedentes: MF-12 (`UserName` como value object com `Either` no use case), MF-13 (`!== undefined` para limpar campo na edição), MF-19 (`description` opcional no create)

## Problema

Das quatro regras da Sugestão 10, duas já estão atendidas e duas não:

| Regra | Estado atual |
| :--- | :--- |
| 1. `instructions` como texto livre, sem `RecipeStep` | ✅ já é `string` no agregado |
| 2. Normalizar quebras de linha e limitar tamanho | ❌ inexistente — `\r\n` do cliente é persistido cru e não há teto de tamanho |
| 3. `description` opcional no create e no edit | ⚠️ parcial — opcional no create (MF-19), mas na edição `description ?? recipe.description` impede **limpar** um resumo já salvo |
| 4. `instructions` não-vazio para publicar | ✅ coberto por `getPublishabilityIssues()` (MF-11/MF-19) |

Sem normalização, o mesmo conteúdo enviado por clientes diferentes (Windows `\r\n` vs. Unix `\n`) gera bytes distintos, o que polui comparação, exibição e a futura busca textual (MF-14). Sem teto de tamanho, o campo aceita payload arbitrário.

## Escopo

**Inclui**

- Value object `RecipeInstructions` com normalização (`\r\n` e `\r` → `\n`, trim das pontas) e limite de 10.000 caracteres
- Erro de domínio `InvalidRecipeInstructionsError` + mapeamento HTTP → 400
- `CreateRecipeUseCase` e `EditRecipeUseCase` resolvendo o VO e devolvendo `left` quando inválido
- `description` limpável na edição: `null` explícito apaga, `undefined` preserva (mesma semântica de MF-13 para tempos)
- Unit specs: VO, create, edit

**Não inclui**

- Entidade `RecipeStep` ou agregado de passos (explicitamente fora de escopo na Fase 1)
- Limite de tamanho para `description` (não especificado nas regras)
- `.max()` no Zod de `instructions`: o teto vale **após** a normalização, então duplicar no boundary rejeitaria payloads `\r\n` que o domínio aceita. Fonte única = domínio
- Sanitização de HTML/Markdown e busca textual (MF-14)
- E2E negativo: a regra vive no domínio, não na infra

## Passos

1. `RecipeInstructions` em `value-objects/` com `MAX_LENGTH = 10_000` e `create(): Either<InvalidRecipeInstructionsError, RecipeInstructions>` (espelha `UserName.create`).
2. `InvalidRecipeInstructionsError` em `enterprise/errors/` implementando `UseCaseError`.
3. `CreateRecipeUseCase`: resolver o VO antes de `Recipe.create`, persistir `.value`.
4. `EditRecipeUseCase`: resolver o VO apenas quando `instructions` vier no payload; `description` tratada por `!== undefined`.
5. `EditRecipeUseCaseRequest.description` e Zod do edit aceitando `null`.
6. Mapear o novo erro para `BadRequestException` e cobrir no spec do mapper.

## Arquivos principais

- `src/domain/enterprise/entities/value-objects/recipe-instructions.ts` (+ spec)
- `src/domain/enterprise/errors/invalid-recipe-instructions-error.ts`
- `src/domain/application/use-cases/create-recipe.ts` (+ spec)
- `src/domain/application/use-cases/edit-recipe.ts` (+ spec)
- `src/infra/http/controllers/edit-recipe.controller.ts`
- `src/infra/http/errors/map-domain-error-to-http-exception.ts` (+ spec)

## Testes

- Unit (VO): converte `\r\n` e `\r` em `\n`; remove espaços das pontas; aceita exatamente 10.000 caracteres; rejeita 10.001.
- Unit (create): instruções com `\r\n` são persistidas normalizadas; acima do limite → `InvalidRecipeInstructionsError`.
- Unit (edit): normalização na edição; acima do limite → `left`; `description: null` limpa; `description: undefined` preserva.
- Unit (mapper): novo erro → 400.
- E2E: sem alteração — happy path de create/edit já cobre o wiring.
- Factories: `makeCreateRecipeUseCaseRequest` / `makeEditRecipeUseCaseRequest` com override só do campo sob asserção.

## Verificação (obrigatória antes de concluir)

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm test
pnpm test:e2e
```

## Critério de pronto

- `instructions` persistidas sempre com `\n` e sem espaços nas pontas.
- Instruções acima de 10.000 caracteres (pós-normalização) → `InvalidRecipeInstructionsError` → HTTP 400.
- `description` pode ser omitida (preserva) ou enviada como `null` (limpa) na edição.
- Publicação continua exigindo `instructions` não-vazio.
- lint, typecheck, build, unit e e2e verdes.

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/`.

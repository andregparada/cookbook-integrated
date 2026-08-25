---
name: write-mf-plan
description: >-
  Writes a Cookbook MF-XX implementation plan in docs/plans/ using the repo
  template, including the convention of moving finished plans to completed/.
  Use when drafting, updating, or completing an MF-XX plan (escreve o plano,
  plano MF, novo MF).
disable-model-invocation: true
---

# Write an MF-XX plan

Plans live in `docs/plans/mf-XX-kebab-title.md`. Number from `docs/regras-de-negocio.md` §6 and existing files — do not reuse a completed ID. Write the body in Portuguese, same tone as a recent plan (short bullets, explicit **Não inclui**).

`docs/plans/completed/plano-melhorias-fundacao.md` is a historical log. Do not edit it. Its “Ao concluir” (checkboxes in the foundation guide) is superseded by the steps below.

## File template

````markdown
# Plano: MF-XX — <título>

## Contexto

- Item: `docs/regras-de-negocio.md` → <sugestão / bloco>; roadmap §6 → MF-XX
- Padrões: `.cursor/skills/create-use-case/SKILL.md`; HTTP: `.cursor/skills/create-controller-e2e/SKILL.md`
- Precedente: <MF-YY e o padrão a reusar>

## Problema

<por que o código atual não atende a regra>

## Escopo

**Inclui**

- …

**Não inclui**

- …

## Passos

1. …
2. …

## Arquivos principais

- …

## Testes

- Unit: regras de negócio / branches `Either` no use case
- E2E: happy path do controller (wiring). Sem duplicar branches de use case

## Verificação (obrigatória antes de concluir)

pnpm lint && pnpm typecheck && pnpm build && pnpm test
# + pnpm test:e2e quando controller/pipe/guard/Prisma mudou (requer Postgres)

## Critério de pronto

- …
- lint / typecheck / build / unit / e2e verdes

## Ao concluir

1. Atualizar backlog §5 e roadmap §6 em `docs/regras-de-negocio.md`.
2. Mover este plano para `docs/plans/completed/` (`git mv`).
````

Canonical examples: `docs/plans/completed/mf-18-autoria-imutavel.md`, `docs/plans/completed/mf-26-read-models-listagem-busca.md`. `Passos`, `Arquivos principais` and `Testes` are expected on new plans. Older drafts may omit them; do not strip them from a new file.

## Completing a plan

After the MF is implemented and verification is green:

1. Update `docs/regras-de-negocio.md` §5 (backlog row) and §6 (roadmap).
2. `git mv docs/plans/mf-XX-….md docs/plans/completed/`
3. Do not rewrite the moved file as a living doc, and do not edit `docs/plans/completed/plano-melhorias-fundacao.md`.

#!/usr/bin/env bash
# stop: eslint (no --fix) + vitest related on files recorded by track-edit.sh.
# On failure, auto-submit a follow-up. Full gate stays in AGENTS.md / verifier.
set -uo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
input=$(cat)

parsed=$(node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  try {
    const d = JSON.parse(raw || "{}")
    process.stdout.write(
      [d.conversation_id || "default", d.status || ""].join("\n"),
    )
  } catch {
    process.stdout.write("default\n")
  }
})
')

conversation=$(printf '%s\n' "$parsed" | sed -n 1p)
status=$(printf '%s\n' "$parsed" | sed -n 2p)
state="${XDG_RUNTIME_DIR:-/tmp}/cursor-hooks/$(basename "$root")-$conversation.files"

if [[ "$status" != "completed" || ! -f "$state" ]]; then
  echo '{}'
  exit 0
fi

lint_files=()
test_files=()
while IFS= read -r file; do
  [[ -f "$file" ]] || continue
  relative="${file#"$root"/}"
  case "$relative" in
    src/*.ts | test/*.ts) lint_files+=("$relative") ;;
  esac
  case "$relative" in
    *.e2e-spec.ts) continue ;;
    src/*.ts | test/*.ts) test_files+=("$relative") ;;
  esac
done < <(sort -u "$state")

if [[ ${#lint_files[@]} -eq 0 && ${#test_files[@]} -eq 0 ]]; then
  rm -f "$state"
  echo '{}'
  exit 0
fi

report=""
if [[ ${#lint_files[@]} -gt 0 ]]; then
  if ! out=$(pnpm exec eslint --max-warnings 0 "${lint_files[@]}" 2>&1); then
    report+=$'## eslint\n'"$(printf '%s\n' "$out" | tail -n 40)"$'\n'
  fi
fi
if [[ ${#test_files[@]} -gt 0 ]]; then
  if ! out=$(pnpm exec vitest related --run "${test_files[@]}" 2>&1); then
    report+=$'## vitest related\n'"$(printf '%s\n' "$out" | grep -v '^\s*$' | tail -n 40)"$'\n'
  fi
fi

if [[ -z "$report" ]]; then
  rm -f "$state"
  echo '{}'
  exit 0
fi

node -e '
const fs = require("fs")
const body = fs.readFileSync(0, "utf8")
const msg =
  "verify-stop (cookbook): eslint or related unit specs fail on files you edited. Fix them, then finish.\n\n```\n" +
  body +
  "```"
process.stdout.write(JSON.stringify({ followup_message: msg }) + "\n")
' <<<"$report"
exit 0

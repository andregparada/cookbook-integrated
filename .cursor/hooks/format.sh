#!/usr/bin/env bash
# afterFileEdit: eslint --fix the edited file. Prettier is not used in isolation
# (no .prettierrc; options live in the prettier/prettier ESLint rule).
set -u

file_path=$(node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  try {
    const parsed = JSON.parse(raw || "{}")
    process.stdout.write(parsed.file_path || "")
  } catch {
    process.stdout.write("")
  }
})
') || exit 0

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

case "$file_path" in
  *.ts | *.mts | *.cts | *.js | *.mjs | *.cjs) ;;
  *) exit 0 ;;
esac

pnpm exec eslint --fix -- "$file_path"
exit $?

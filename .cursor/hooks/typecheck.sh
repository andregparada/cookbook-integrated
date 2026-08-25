#!/usr/bin/env bash
# stop: run pnpm typecheck; on failure, follow up so the agent must fix before finishing.
set -u

status=$(node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  try {
    const parsed = JSON.parse(raw || "{}")
    process.stdout.write(parsed.status || "completed")
  } catch {
    process.stdout.write("completed")
  }
})
') || status="completed"

if [ "$status" != "completed" ]; then
  printf '%s\n' '{}'
  exit 0
fi

output=$(pnpm typecheck 2>&1)
code=$?

if [ "$code" -eq 0 ]; then
  printf '%s\n' '{}'
  exit 0
fi

printf '%s' "$output" | node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  process.stdout.write(JSON.stringify({ followup_message: raw }) + "\n")
})
'
exit 0

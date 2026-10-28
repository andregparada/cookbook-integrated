#!/usr/bin/env bash
# afterFileEdit: record the edited path for verify-stop.sh. Never rewrites the
# file, so the agent's view of it stays in sync with disk.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
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
      [d.conversation_id || "default", d.file_path || ""].join("\n"),
    )
  } catch {
    process.stdout.write("default\n")
  }
})
')

conversation=$(printf '%s\n' "$parsed" | sed -n 1p)
file=$(printf '%s\n' "$parsed" | sed -n 2p)

if [[ -z "$file" || "$file" != "$root/"* ]]; then
  exit 0
fi

state_dir="${XDG_RUNTIME_DIR:-/tmp}/cursor-hooks"
mkdir -p "$state_dir"
printf '%s\n' "$file" >> "$state_dir/$(basename "$root")-$conversation.files"

exit 0

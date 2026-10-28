#!/usr/bin/env bash
# beforeShellExecution: block prisma migrate reset and destructive db push.
set -euo pipefail

input=$(cat)

node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  let command = ""
  try {
    const d = JSON.parse(raw || "{}")
    command = String(d.command || "")
  } catch {
    process.stdout.write(JSON.stringify({ permission: "allow" }) + "\n")
    process.exit(0)
  }

  const destructive =
    /\bprisma\s+migrate\s+reset\b/.test(command) ||
    (/\bprisma\s+db\s+push\b/.test(command) &&
      (/--force-reset\b/.test(command) || /--accept-data-loss\b/.test(command)))

  if (destructive) {
    process.stdout.write(
      JSON.stringify({
        permission: "deny",
        user_message:
          "Blocked: prisma migrate reset and prisma db push --force-reset/--accept-data-loss destroy local data.",
        agent_message:
          "Use prisma migrate dev to apply migrations. Do not reset the database to fix test failures.",
      }) + "\n",
    )
    process.exit(0)
  }

  process.stdout.write(JSON.stringify({ permission: "allow" }) + "\n")
})
' <<<"$input"

exit 0

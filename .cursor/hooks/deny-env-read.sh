#!/usr/bin/env bash
# beforeReadFile: block .env secrets (failClosed on parse errors via exit 2).
set -euo pipefail

input=$(cat)

node -e '
let raw = ""
process.stdin.on("data", (chunk) => {
  raw += chunk
})
process.stdin.on("end", () => {
  let filePath = ""
  try {
    const d = JSON.parse(raw || "{}")
    filePath = String(d.file_path || d.path || d.filePath || "")
  } catch {
    process.exit(2)
  }

  if (!filePath) {
    process.stdout.write(JSON.stringify({ permission: "allow" }) + "\n")
    process.exit(0)
  }

  const base = filePath.split(/[/\\]/).pop() || ""
  const blocked =
    base === ".env" ||
    (base.startsWith(".env.") && base !== ".env.example")

  if (blocked) {
    process.stdout.write(
      JSON.stringify({
        permission: "deny",
        user_message: "Blocked: reading .env files is not allowed for the agent.",
        agent_message:
          "Do not read .env. Use .env.example for variable names; ask the user to set secrets locally.",
      }) + "\n",
    )
    process.exit(0)
  }

  process.stdout.write(JSON.stringify({ permission: "allow" }) + "\n")
})
' <<<"$input"

exit 0

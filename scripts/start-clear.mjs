#!/usr/bin/env node
/**
 * npm run start — очищает экран и scrollback, затем expo start.
 * npx expo start напрямую очистку не делает.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const shell = process.env.SHELL || "/bin/zsh";
const expoBin = path.join(root, "node_modules", ".bin", "expo");
const extraArgs = process.argv.slice(2).map((a) => JSON.stringify(a)).join(" ");

// clear + erase scrollback (3J) — в одном shell, чтобы сработало в zsh и в терминале Cursor/VS Code
const command = [
  `cd ${JSON.stringify(root)}`,
  "command -v clear >/dev/null && clear",
  "printf '\\033[3J\\033[2J\\033[H'",
  extraArgs
    ? `exec ${JSON.stringify(expoBin)} start ${extraArgs}`
    : `exec ${JSON.stringify(expoBin)} start`,
].join(" && ");

const child = spawn(shell, ["-lc", command], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

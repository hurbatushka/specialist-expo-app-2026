#!/usr/bin/env node
/**
 * EAS must run from the standalone specialist repo root — not from blagodeti-crm-app/MOBILE APP/...
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

if (!fs.existsSync(path.join(cwd, "app.json")) || !fs.existsSync(path.join(cwd, "eas.json"))) {
  console.error("❌ Запускайте EAS из корня specialist-expo-app-2026 (нужны app.json и eas.json).");
  process.exit(1);
}

let gitRoot;
try {
  gitRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
} catch {
  console.error("❌ Нет git-репозитория. Клонируйте https://github.com/hurbatushka/specialist-expo-app-2026");
  process.exit(1);
}

if (path.resolve(gitRoot) !== path.resolve(cwd)) {
  console.error(`❌ Текущая папка не корень git. Перейдите в:\n   ${gitRoot}`);
  process.exit(1);
}

let remote = "";
try {
  remote = execSync("git remote get-url origin", { encoding: "utf8" }).trim();
} catch {
  /* optional */
}

if (remote && !remote.includes("specialist-expo-app-2026")) {
  console.error(
    `❌ origin указывает не на specialist-expo-app-2026:\n   ${remote}\n` +
      "   Сборка из CRM monorepo ломается (projectRoot MOBILE APP/specialist-expo-app).",
  );
  process.exit(1);
}

if (gitRoot.includes("blagodeti-crm-app") || gitRoot.includes("MOBILE APP")) {
  console.error("❌ Git root внутри CRM monorepo. Используйте отдельный клон specialist-expo-app-2026.");
  process.exit(1);
}

console.log("✓ EAS root OK:", cwd);

#!/usr/bin/env node
/**
 * Проверка только react-hooks/rules-of-hooks (хуки после return / в if).
 * Не блокирует сборку из‑за прочих eslint-ошибок в проекте.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const eslint = new ESLint({ cwd: root });

const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
const hookErrors = [];

for (const result of results) {
  for (const msg of result.messages) {
    if (msg.ruleId === 'react-hooks/rules-of-hooks') {
      hookErrors.push({ filePath: result.filePath, ...msg });
    }
  }
}

if (hookErrors.length === 0) {
  console.log('react-hooks/rules-of-hooks: OK');
  process.exit(0);
}

console.error(`react-hooks/rules-of-hooks: ${hookErrors.length} error(s)\n`);
for (const e of hookErrors) {
  const rel = path.relative(root, e.filePath);
  console.error(`${rel}:${e.line}:${e.column}  ${e.message}`);
}
process.exit(1);

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const isAll = process.argv.includes('--all');

const targets = isAll
  ? ['dist', 'coverage', '.cache', '.tmp', 'node_modules']
  : ['dist', 'coverage', '.cache/tmp', '.cache/logs', '.tmp'];

for (const target of targets) {
  const absolutePath = resolve(process.cwd(), target);
  try {
    rmSync(absolutePath, { recursive: true, force: true });
    process.stdout.write(`[clean] removed ${target}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`[clean] skipped ${target} (${message})\n`);
  }
}

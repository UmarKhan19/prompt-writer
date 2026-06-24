import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isProjectRoot(path: string): boolean {
  return (
    existsSync(join(path, 'package.json')) &&
    existsSync(join(path, 'src/mastra'))
  );
}

function findProjectRootFrom(startPath: string): string | undefined {
  let current = startPath;

  for (let depth = 0; depth < 8; depth += 1) {
    if (isProjectRoot(current)) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }

  return undefined;
}

export function resolveProjectPath(...segments: string[]): string {
  const candidates = [
    findProjectRootFrom(process.cwd()),
    findProjectRootFrom(dirname(fileURLToPath(import.meta.url))),
  ].filter((path): path is string => Boolean(path));

  for (const root of candidates) {
    const resolved = join(root, ...segments);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  if (candidates[0]) {
    return join(candidates[0], ...segments);
  }

  throw new Error(
    `Could not resolve project path for ${segments.join('/')}`,
  );
}
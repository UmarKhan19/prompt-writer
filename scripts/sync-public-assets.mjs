import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicMastraRoot = join(projectRoot, 'src/mastra/public/src/mastra');

const assetCopies = [
  {
    from: join(
      projectRoot,
      'src/mastra/agents/prompt-writer/system-instructions.md',
    ),
    to: join(
      publicMastraRoot,
      'agents/prompt-writer/system-instructions.md',
    ),
  },
  {
    from: join(projectRoot, 'src/mastra/writing-skills'),
    to: join(publicMastraRoot, 'writing-skills'),
  },
];

const requiredOutputs = [
  join(publicMastraRoot, 'agents/prompt-writer/system-instructions.md'),
  join(publicMastraRoot, 'writing-skills/prompt-writing-core/SKILL.md'),
  join(publicMastraRoot, 'writing-skills/coding-prompt/SKILL.md'),
];

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await rm(join(projectRoot, 'src/mastra/public/src'), {
    recursive: true,
    force: true,
  });
  await mkdir(publicMastraRoot, { recursive: true });

  for (const { from, to } of assetCopies) {
    if (!(await pathExists(from))) {
      throw new Error(`Missing source asset: ${from}`);
    }

    await mkdir(dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
  }

  for (const path of requiredOutputs) {
    if (!(await pathExists(path))) {
      throw new Error(`Sync verification failed: ${path}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
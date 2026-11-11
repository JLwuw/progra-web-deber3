const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const appRoot = path.join(repoRoot, 'mi-cartelera-personal');

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const event = JSON.parse(input);
  const toolInput = event.tool_input || {};
  const files = new Set();

  if (typeof toolInput.file_path === 'string') files.add(toolInput.file_path);

  // Codex reports patch text in tool_input.command, including renamed files.
  if (typeof toolInput.command === 'string') {
    for (const match of toolInput.command.matchAll(
      /^\*\*\* (?:Add File|Update File|Move to): (.+)\r?$/gm,
    )) files.add(match[1].trim());
  }

  const targets = [];
  for (const file of files) {
    const target = path.resolve(event.cwd || repoRoot, file);
    const relative = path.relative(repoRoot, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    if (relative.split(path.sep).some((part) =>
      part.startsWith('.env') || ['.git', 'node_modules', 'dist'].includes(part),
    )) continue;
    if (!/\.(?:ts|tsx|js|json|css)$/i.test(target)) continue;
    try {
      // Skip removed files, directories, and symlinks.
      if (!(await fs.lstat(target)).isFile()) continue;
      const resolved = await fs.realpath(target);
      const resolvedRelative = path.relative(repoRoot, resolved);
      if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) continue;
      targets.push(target);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!targets.length) return;

  let prettier;
  try {
    prettier = require(require.resolve('prettier', { paths: [appRoot] }));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    throw new Error('Install Prettier in mi-cartelera-personal with npm install --save-dev --save-exact prettier.');
  }

  for (const target of targets) {
    const info = await prettier.getFileInfo(target, {
      ignorePath: path.join(repoRoot, '.prettierignore'),
      withNodeModules: false,
    });
    if (info.ignored || !info.inferredParser) continue;
    const options = (await prettier.resolveConfig(target)) || {};
    const original = await fs.readFile(target, 'utf8');
    const formatted = await prettier.format(original, { ...options, filepath: target });
    if (formatted !== original) await fs.writeFile(target, formatted);
  }
}

main().catch((error) => {
  console.error(`Prettier hook: ${error.message}`);
  process.exitCode = 0;
});

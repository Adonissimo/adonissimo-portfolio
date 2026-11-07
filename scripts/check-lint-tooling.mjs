import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// Resolve through Next's actual lint dependency tree, including nested installs.
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve('eslint-config-next'));
const typescriptRequire = createRequire(nextRequire.resolve('typescript-eslint'));
const parserEntry = typescriptRequire.resolve('@typescript-eslint/parser');
const parserRequire = createRequire(parserEntry);
const estreeEntry = parserRequire.resolve('@typescript-eslint/typescript-estree');
const estreeRequire = createRequire(estreeEntry);
const matcherEntry = estreeRequire.resolve('minimatch');

function packageVersion(entry, name) {
  let directory = dirname(entry);
  while (true) {
    try {
      const info = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
      if (info.name === name) return info.version;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`Cannot identify ${name}. Run npm install again.`);
    directory = parent;
  }
}

assert.equal(packageVersion(estreeEntry, '@typescript-eslint/typescript-estree'), '8.72.1',
  'The compatibility probe targets typescript-estree 8.72.1. Review it before changing the parser cohort.');
assert.equal(packageVersion(matcherEntry, 'minimatch'), '11.0.4',
  'The scoped minimatch patch is not installed. Run npm install before checking or deploying.');

const { Minimatch } = estreeRequire('minimatch');
const options = { dot: true, windowsPathsNoEscape: true };
const project = new Minimatch('src/**/*.{ts,tsx}', options);
assert.equal(project.match('src/page.tsx'), true);
assert.equal(project.match('src/nested/page.ts'), true);
assert.equal(project.match('src/page.js'), false);
assert.equal(new Minimatch('*.ts', options).match('default.ts'), true);
assert.equal(new Minimatch('*.ts', options).match('nested/default.ts'), false);
assert.equal(new Minimatch('**/node_modules/**', options).match('src/node_modules/example/index.ts'), true);
assert.equal(new Minimatch('C:\\portfolio\\src\\*.ts', options).match('C:/portfolio/src/example.ts'), true);

// Exercise the real parser's project glob and default-project matcher. These
// are not covered by the ordinary untyped Next lint preset or business tests.
const parser = parserRequire(parserEntry);
const directory = mkdtempSync(join(tmpdir(), 'adonissimo-lint-'));
try {
  mkdirSync(join(directory, 'src'));
  const code = 'export const quest: string = "ready";\n';
  const sourceFile = join(directory, 'src', 'example.ts');
  const defaultFile = join(directory, 'default.ts');
  writeFileSync(sourceFile, code);
  writeFileSync(defaultFile, code);
  writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', strict: true, noEmit: true },
    include: ['src/**/*.ts']
  }));

  const typed = parser.parseForESLint(code, {
    sourceType: 'module',
    filePath: sourceFile,
    tsconfigRootDir: directory,
    project: ['tsconfig*.json']
  });
  assert.ok(typed.services.program?.getSourceFile(sourceFile), 'Project glob must resolve the real source file.');
  parser.clearCaches?.();

  const fallback = parser.parseForESLint(code, {
    sourceType: 'module',
    filePath: defaultFile,
    tsconfigRootDir: directory,
    projectService: { allowDefaultProject: ['*.ts'], defaultProject: 'tsconfig.json' }
  });
  assert.ok(fallback.services.program?.getSourceFile(defaultFile), 'Default-project glob must resolve the real source file.');
} finally {
  parser.clearCaches?.();
  rmSync(directory, { recursive: true, force: true });
}

process.stdout.write('TypeScript lint matcher and project resolution: PASS\n');

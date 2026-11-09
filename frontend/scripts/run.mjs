import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command = 'dev', ...args] = process.argv.slice(2);
let cwd = root,
  drive = null,
  owned = false;
const mappingRoot = path.dirname(root);
if (process.platform === 'win32' && root.includes('#')) {
  const mappings = spawnSync('subst', [], { encoding: 'utf8' }).stdout ?? '';
  const match = mappings
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z]):\\: => (.*)$/i))
    .find(
      (match) =>
        match &&
        path.resolve(match[2]).toLowerCase() === mappingRoot.toLowerCase(),
    );
  if (match) drive = match[1] + ':';
  else {
    for (const letter of 'GHIJKLMNOPQRSTUVWXYZ') {
      if (!existsSync(`${letter}:\\`)) {
        drive = letter + ':';
        const result = spawnSync('subst', [drive, mappingRoot]);
        if (result.status !== 0)
          throw new Error('Không tạo được đường dẫn tương thích Windows.');
        owned = true;
        break;
      }
    }
  }
  if (!drive)
    throw new Error('Không còn ký tự ổ đĩa trống cho đường dẫn tương thích.');
  cwd = path.join(drive + '\\', path.basename(root));
}
const targets = {
  dev: 'node_modules/vite/bin/vite.js',
  build: 'node_modules/vite/bin/vite.js',
  start: 'node_modules/vite/bin/vite.js',
  test: 'node_modules/vitest/vitest.mjs',
};
if (!Object.hasOwn(targets, command))
  throw new Error('Lệnh không được hỗ trợ.');
const preload = drive
  ? ['--require', path.join(cwd, 'scripts/windows-paths.cjs')]
  : [];
const child = spawn(
  process.execPath,
  [
    ...preload,
    path.join(cwd, targets[command]),
    command === 'test' ? 'run' : command === 'dev' ? 'dev' : command === 'start' ? 'preview' : 'build',
    ...args,
  ],
  {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(drive ? { GYM_SUBST_ROOT: root, GYM_ALIAS_ROOT: cwd } : {}),
    },
    windowsHide: true,
  },
);
function cleanup() {
  if (owned && drive) {
    const mapping = spawnSync('subst', [], { encoding: 'utf8' }).stdout ?? '';
    if (
      mapping
        .toLowerCase()
        .includes(`${drive.toLowerCase()}\\: => ${mappingRoot.toLowerCase()}`)
    )
      spawnSync('subst', [drive, '/D']);
    owned = false;
  }
}
child.on('exit', (code) => {
  cleanup();
  process.exitCode = code ?? 1;
});
child.on('error', (error) => {
  console.error(error.message);
  cleanup();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
process.on('exit', cleanup);

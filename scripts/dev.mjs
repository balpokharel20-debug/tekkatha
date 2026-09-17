import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
const tasks = [
  ['Backend', 'backend', ['--watch', 'src/server.js']],
  ['Frontend', 'frontend', [vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort']],
  ['Admin', 'admin', [vite, '--host', '127.0.0.1', '--port', '5174', '--strictPort']],
];
const children = tasks.map(([name, directory, args]) => {
  const child = spawn(process.execPath, args, {
    cwd: path.join(root, directory),
    stdio: 'inherit',
    windowsHide: true,
  });
  child.on('error', (e) => {
    console.error(name + ': ' + e.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(name + ' stopped.');
      stop(code || 1);
    }
  });
  return child;
});
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300).unref();
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log(
  '\nTekkatha local apps\nWebsite: http://localhost:5173\nAdmin: http://localhost:5174/hello\nAPI: http://localhost:4000/api/health\n',
);

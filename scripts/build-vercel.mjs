import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this build through npm so npm_execpath is available.');

function runNpm(args, env) {
  execFileSync(process.execPath, [npmCli, ...args], { cwd: root, env, stdio: 'inherit' });
}

const frontendEnv = {
  ...process.env,
  VITE_ADMIN_URL: '/cms/hello',
  VITE_VERCEL_DEPLOY: 'true',
};
const adminEnv = { ...process.env, VITE_BASE: '/cms/', VITE_VERCEL_DEPLOY: 'true' };
runNpm(['run', 'build', '--workspace', 'frontend'], frontendEnv);
runNpm(['run', 'build', '--workspace', 'admin'], adminEnv);

const publicDir = path.join(root, 'public');
await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
await cp(path.join(root, 'frontend', 'dist'), publicDir, { recursive: true });
await cp(path.join(root, 'admin', 'dist'), path.join(publicDir, 'cms'), { recursive: true });
console.log('Vercel static output is ready in public/.');

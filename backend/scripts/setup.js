import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { connect, client } from '../src/db.js';
import { hashPassword } from '../src/auth.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
try {
  await access(path.join(root, 'backend/.env'));
} catch {
  await writeFile(
    path.join(root, 'backend/.env'),
    await readFile(path.join(root, 'backend/.env.example')),
  );
}
try {
  const db = await connect();
  const seed = JSON.parse(await readFile(path.join(root, 'backend/seeds/content.json'), 'utf8'));
  for (const name of ['articles', 'products'])
    for (const entry of seed[name])
      await db
        .collection(name)
        .updateOne(
          { id: entry.id },
          {
            $setOnInsert: {
              ...entry,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            },
          },
          { upsert: true },
        );
  await db
    .collection('settings')
    .updateOne(
      { id: 'brand' },
      {
        $setOnInsert: {
          id: 'brand',
          siteName: 'Tekkatha',
          tagline: 'Technology, Explained.',
          description:
            'Tekkatha covers the latest technology news, smartphone and laptop prices, gadget reviews, product comparisons, PC builds, AI, gaming, and buying guides.',
          primaryColor: '#1357D6',
          aiName: 'Tekkatha AI',
          adminName: 'Tekkatha CMS',
          contactEmail: 'contact@tekkatha.com',
          editorialEmail: 'editorial@tekkatha.com',
          advertiseEmail: 'advertise@tekkatha.com',
          supportEmail: 'support@tekkatha.com',
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  if (!(await db.collection('admins').countDocuments({}))) {
    const email = (process.env.ADMIN_EMAIL || 'admin@tekkatha.local').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || randomBytes(24).toString('base64url');
    if (password.length < 12) throw new Error('Admin password must be at least 12 characters.');
    await db
      .collection('admins')
      .insertOne({
        email,
        name: 'Tekkatha Admin',
        role: 'super_admin',
        passwordHash: await hashPassword(password),
        createdAt: new Date(),
      });
    await mkdir(path.join(root, '.local'), { recursive: true });
    await writeFile(
      path.join(root, '.local/admin-credentials.json'),
      JSON.stringify({ email, password, adminUrl: 'http://localhost:5174/hello' }, null, 2) + '\n',
      { mode: 0o600 },
    );
    await writeFile(
      path.join(root, '.local/admin-credentials.txt'),
      `Tekkatha CMS local sign-in\nURL: http://localhost:5174/hello\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. It is ignored by Git.\n`,
      { mode: 0o600 },
    );
    console.log('Initial admin created. Credentials: D:\\tekkatha\\.local\\admin-credentials.txt');
  } else console.log('Existing admin accounts preserved.');
  console.log('MongoDB initialized. Existing articles, products and settings were preserved.');
} catch (error) {
  console.error('Setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

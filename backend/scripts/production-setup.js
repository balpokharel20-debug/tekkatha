import { connect, client } from '../src/db.js';
import { validateProductionConfig } from '../src/config.js';
import { hashPassword } from '../src/auth.js';
import { adminCreateSchema } from '../src/schemas.js';
import { DEFAULT_BRAND_SETTINGS } from '../../shared/brand-settings.js';

if (process.env.NODE_ENV !== 'production') {
  console.error('Set NODE_ENV=production before running this initializer.');
  process.exit(1);
}

try {
  validateProductionConfig();
  const database = await connect();
  await database.collection('settings').updateOne(
    { id: 'brand' },
    { $setOnInsert: { ...DEFAULT_BRAND_SETTINGS, updatedAt: new Date() } },
    { upsert: true },
  );
  if (await database.collection('admins').countDocuments()) {
    console.log('Administrator account already exists; no account or content was changed.');
  } else {
    const input = adminCreateSchema.parse({
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME || 'Tekkatha Admin',
      password: process.env.ADMIN_PASSWORD,
      role: 'super_admin',
    });
    if (input.password.length < 16)
      throw new Error('Use a unique initial administrator password of at least 16 characters.');
    await database.collection('admins').insertOne({
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      createdAt: new Date(),
    });
    console.log('Initial super administrator created. No sample articles or products were added.');
  }
} catch (error) {
  console.error('Production initialization failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

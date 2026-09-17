import { MongoClient } from 'mongodb';
import { config } from './config.js';
export const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
export let db;
export async function connect() {
  await client.connect();
  db = client.db(config.database);
  await db.command({ ping: 1 });
  await Promise.all([
    db.collection('admins').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('articles').createIndex({ id: 1 }, { unique: true }),
    db.collection('articles').createIndex({ status: 1, deletedAt: 1, createdAt: -1 }),
    db.collection('products').createIndex({ id: 1 }, { unique: true }),
    db.collection('products').createIndex({ type: 1, brand: 1, price: 1 }),
  ]);
  return db;
}
export function publicRecord(record) {
  if (!record) return null;
  const { _id, ...value } = record;
  return value;
}

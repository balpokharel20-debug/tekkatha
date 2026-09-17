import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
  quiet: true,
});
export const config = {
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tekkatha',
  database: process.env.MONGODB_DATABASE || 'tekkatha',
  production: process.env.NODE_ENV === 'production',
  origins: (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),
};

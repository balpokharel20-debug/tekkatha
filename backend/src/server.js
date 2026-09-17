import { connect, client } from './db.js';
import { app } from './app.js';
import { config } from './config.js';
try {
  await connect();
  const server = app.listen(config.port, config.host, () =>
    console.log(
      `Tekkatha API: http://${config.host}:${config.port} · MongoDB connected (${config.database})`,
    ),
  );
  server.on('error', (err) => {
    console.error('Backend could not start:', err.code);
    process.exit(1);
  });
  for (const event of ['SIGINT', 'SIGTERM'])
    process.on(event, () =>
      server.close(async () => {
        await client.close();
        process.exit(0);
      }),
    );
} catch (err) {
  console.error(
    'MongoDB connection failed. Check MONGODB_URI and ensure MongoDB is running. Error:',
    err.name,
  );
  process.exit(1);
}

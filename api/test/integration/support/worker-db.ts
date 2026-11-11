import { Client } from 'pg';
import type { ContainerInfo } from './container-info.js';

/**
 * One Postgres database (and one Redis logical DB) per Vitest worker. Workers
 * run in separate processes, so a dedicated database per worker is what lets the
 * integration suites run in parallel without clobbering each other's rows. The
 * schema is then built once per worker via TypeORM `synchronize` on the first
 * app boot (see `integration-app.ts`).
 */
export function workerId(): number {
  // Vitest exposes a 1-based worker index; default to 1 for a single fork.
  const raw = process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? '1';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function workerDatabaseName(): string {
  return `test_w${workerId()}`;
}

/** Redis ships with 16 logical DBs (0–15); wrap so a high worker count is safe. */
export function workerRedisDb(): number {
  return workerId() % 16;
}

/**
 * Ensure this worker's database exists and carries the uuid-ossp extension the
 * schema's `uuid_generate_v4()` defaults need. Idempotent: the first spec in a
 * worker creates the database, later specs find it already present.
 */
export async function ensureWorkerDatabase(
  info: ContainerInfo,
  databaseName: string,
): Promise<void> {
  const admin = new Client({
    host: info.postgres.host,
    port: info.postgres.port,
    user: info.postgres.username,
    password: info.postgres.password,
    database: 'postgres',
  });
  await admin.connect();
  try {
    const existing = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (!existing.rowCount) {
      // Worker names never collide, so this can't race another worker; the catch
      // only guards the rare case of a worker racing its own first two specs.
      try {
        await admin.query(`CREATE DATABASE "${databaseName}"`);
      } catch (error) {
        const alreadyExists = /already exists/i.test(
          error instanceof Error ? error.message : String(error),
        );
        if (!alreadyExists) throw error;
      }
    }
  } finally {
    await admin.end();
  }

  // The extension lives inside the database, so connect to it to create it. The
  // app's migrations assume it exists; synchronize needs it for uuid defaults.
  const db = new Client({
    host: info.postgres.host,
    port: info.postgres.port,
    user: info.postgres.username,
    password: info.postgres.password,
    database: databaseName,
  });
  await db.connect();
  try {
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  } finally {
    await db.end();
  }
}

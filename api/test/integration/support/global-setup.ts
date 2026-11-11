import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import {
  deleteContainerInfo,
  writeContainerInfo,
  type ContainerInfo,
} from './container-info.js';

/**
 * Vitest global setup: starts the Postgres + Redis containers ONCE for the whole
 * integration run, writes their coordinates to a temp file, and returns a
 * teardown that stops them. Each test worker clones its own database off this
 * shared Postgres (see `worker-db.ts`) so the suites stay isolated in parallel.
 *
 * Mirrors the user-service Jest harness, minus RabbitMQ (d-pathway's async work
 * runs on BullMQ over the same Redis).
 */
export async function setup(): Promise<void> {
  const startedAt = Date.now();
  console.log('🚀 Starting integration test containers...');

  // Alpine images pull and boot faster. The generous startup timeout (default is
  // 30s) keeps a busy CI runner from flaking the whole suite before a container
  // has logged "ready to accept connections".
  const startupTimeoutMs = 120_000;

  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine')
      .withStartupTimeout(startupTimeoutMs)
      .start(),
    new RedisContainer('redis:7-alpine')
      .withStartupTimeout(startupTimeoutMs)
      .start(),
  ]);

  const info: ContainerInfo = {
    postgres: {
      host: postgres.getHost(),
      port: postgres.getPort(),
      username: postgres.getUsername(),
      password: postgres.getPassword(),
      database: postgres.getDatabase(),
    },
    redis: {
      host: redis.getHost(),
      port: redis.getPort(),
    },
  };
  writeContainerInfo(info);

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`✅ Integration containers up in ${seconds}s`);
  console.log(`   PostgreSQL: ${info.postgres.host}:${info.postgres.port}`);
  console.log(`   Redis:      ${info.redis.host}:${info.redis.port}`);

  // Teardown runs after the whole suite: stop both containers and drop the file.
  return async () => {
    console.log('🧹 Stopping integration test containers...');
    await Promise.allSettled([postgres.stop(), redis.stop()]);
    deleteContainerInfo();
    console.log('✅ Integration containers stopped');
  };
}

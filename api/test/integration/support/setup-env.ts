/**
 * Per-worker setup file. Runs BEFORE each test file is imported — which matters
 * because `AppModule`'s ConfigModule validates (and caches) `process.env` at
 * import time. Every required variable, including this worker's container-backed
 * DATABASE_URL/REDIS_URL, must already be present by then, so we set them here.
 *
 * The database itself is created lazily in `createIntegrationApp` (the URL only
 * needs to be a valid string for import-time validation; the connection is made
 * later, at `app.init()`).
 */
import {
  postgresUrl,
  readContainerInfo,
  redisUrl,
} from './container-info.js';
import { applyBaseTestEnv } from './test-env.js';
import { workerDatabaseName, workerRedisDb } from './worker-db.js';

applyBaseTestEnv();

const info = readContainerInfo();
process.env.DATABASE_URL = postgresUrl(info, workerDatabaseName());
process.env.REDIS_URL = redisUrl(info, workerRedisDb());

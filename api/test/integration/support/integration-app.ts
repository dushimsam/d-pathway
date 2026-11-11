import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import type { Server } from 'node:http';
import { DataSource } from 'typeorm';
import type { Redis } from 'ioredis';
import { AppModule } from '../../../src/app.module.js';
import {
  CATALOGUE_CACHE_PREFIX,
  REDIS_CLIENT,
} from '../../../src/redis/redis.constants.js';
import { StripeService } from '../../../src/modules/wallet/services/stripe.service.js';
import { MailService } from '../../../src/modules/mail/mail.service.js';
import { readContainerInfo } from './container-info.js';
import { ensureWorkerDatabase, workerDatabaseName } from './worker-db.js';
import { FakeMailService, FakeStripeService } from './mocks.js';

export interface IntegrationApp {
  app: INestApplication;
  dataSource: DataSource;
  /** The underlying HTTP server, ready to hand to supertest. */
  server: Server;
  /** The installed Stripe fake — inspect issued checkout sessions. */
  stripe: FakeStripeService;
  /** The installed mailer fake — inspect would-be emails via `mail.sent`. */
  mail: FakeMailService;
  /** Empty every table — call in `afterEach` to isolate tests. */
  truncate: () => Promise<void>;
  /** Close the app, its DataSource, and Redis/BullMQ connections. */
  close: () => Promise<void>;
}

export interface CreateIntegrationAppOptions {
  /** Hook to override additional providers before the module compiles. */
  overrides?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}

// Synchronize is idempotent but not free; once a worker's schema is built, later
// app boots in the same process skip it.
let schemaReadyFor: string | null = null;

/**
 * Boot the real AppModule against this worker's throwaway database, wired exactly
 * like `main.ts` (global prefix + the same ValidationPipe) so tests exercise the
 * production request pipeline. The first boot per worker builds the schema from
 * the entity set via TypeORM `synchronize`.
 */
export async function createIntegrationApp(
  options: CreateIntegrationAppOptions = {},
): Promise<IntegrationApp> {
  const info = readContainerInfo();

  // DATABASE_URL/REDIS_URL are already set by the setup file; here we make sure
  // this worker's database (and the uuid-ossp extension) actually exists before
  // the app connects at app.init().
  const databaseName = workerDatabaseName();
  await ensureWorkerDatabase(info, databaseName);

  // Third parties are always mocked: the suite must not reach Stripe or Resend.
  const stripe = new FakeStripeService();
  const mail = new FakeMailService();

  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(StripeService)
    .useValue(stripe)
    .overrideProvider(MailService)
    .useValue(mail);
  if (options.overrides) builder = options.overrides(builder);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  await app.init();

  const dataSource = app.get(DataSource);
  if (schemaReadyFor !== databaseName) {
    // Build the schema from the entity set. TypeORM creates the uuid-ossp
    // extension defaults against the database we already prepared.
    await dataSource.synchronize();
    schemaReadyFor = databaseName;
  }

  const server = app.getHttpServer() as Server;
  const redis = app.get<Redis>(REDIS_CLIENT);

  const truncate = async (): Promise<void> => {
    const tables = dataSource.entityMetadatas
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    // Clear Postgres AND the catalogue cache: emptying only the tables would
    // leave stale cache entries that leak between tests. We delete ONLY the
    // cache namespace (not flushdb) so the BullMQ queue's own keys survive —
    // flushing the whole DB yanks keys out from under in-flight event jobs.
    const [, cacheKeys] = await Promise.all([
      tables
        ? dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`)
        : Promise.resolve(),
      redis.keys(`${CATALOGUE_CACHE_PREFIX}*`),
    ]);
    if (cacheKeys.length) await redis.del(...cacheKeys);
    mail.clear();
  };

  const close = async (): Promise<void> => {
    await app.close();
  };

  return { app, dataSource, server, stripe, mail, truncate, close };
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Connection details for the shared Postgres + Redis containers, written by the
 * Vitest global setup (one process) and read back by every test worker (other
 * processes). Env set in global setup does NOT cross the process boundary into
 * workers, so — exactly like the user-service Jest harness — we hand the details
 * off through a temp file instead.
 */
export interface ContainerInfo {
  postgres: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
}

const INFO_PATH = path.join(here, '..', '.tmp', 'testcontainers.json');

export function writeContainerInfo(info: ContainerInfo): void {
  fs.mkdirSync(path.dirname(INFO_PATH), { recursive: true });
  fs.writeFileSync(INFO_PATH, JSON.stringify(info, null, 2));
}

export function readContainerInfo(): ContainerInfo {
  if (!fs.existsSync(INFO_PATH)) {
    throw new Error(
      `Testcontainers info not found at ${INFO_PATH}.\n` +
        'Ensure the Vitest integration config declares this file as its ' +
        'globalSetup (vitest.integration.config.ts).',
    );
  }
  return JSON.parse(fs.readFileSync(INFO_PATH, 'utf-8')) as ContainerInfo;
}

export function deleteContainerInfo(): void {
  fs.rmSync(path.dirname(INFO_PATH), { recursive: true, force: true });
}

/** Postgres connection URL for a specific database on the shared container. */
export function postgresUrl(info: ContainerInfo, database: string): string {
  const { username, password, host, port } = info.postgres;
  return `postgres://${username}:${password}@${host}:${port}/${database}`;
}

/** Redis URL pinned to a logical DB index for per-worker cache/queue isolation. */
export function redisUrl(info: ContainerInfo, db: number): string {
  return `redis://${info.redis.host}:${info.redis.port}/${db}`;
}

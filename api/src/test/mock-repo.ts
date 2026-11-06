import { vi } from 'vitest';
import type { Repository } from 'typeorm';

type MockedRepo<T extends object> = Repository<T> &
  Record<string, ReturnType<typeof vi.fn>>;

/**
 * A fully-mocked TypeORM repository. Each method is a vi.fn() so specs can set
 * return values per case. `create` echoes its input by default (as TypeORM does).
 */
export function mockRepo<T extends object = Record<string, unknown>>(): MockedRepo<T> {
  const repo = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    save: vi.fn(async (e: unknown) => e),
    create: vi.fn((e: unknown) => e),
    update: vi.fn(async () => ({ affected: 1 })),
    delete: vi.fn(async () => ({ affected: 1 })),
    count: vi.fn(async () => 0),
    createQueryBuilder: vi.fn(),
  };
  return repo as unknown as MockedRepo<T>;
}

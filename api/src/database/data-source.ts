import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { entities } from './entities.js';

loadEnv();

/**
 * DataSource used by the TypeORM CLI (migration:generate / run / revert) and by
 * the seed runner. The Nest app configures its own DataSource in DatabaseModule,
 * but both share the same entity set and naming strategy.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities,
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: ['error', 'warn'],
});

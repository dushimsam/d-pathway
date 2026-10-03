import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// The CLI (migrations, seed) runs outside Nest, so load the .env file manually.
// process.loadEnvFile is available on Node 20.6+ and is a no-op-safe guard here.
try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. variables already provided by the environment).
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env first.');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: false,
});

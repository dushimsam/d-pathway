import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PathwaysModule } from './modules/pathways/pathways.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule, PathwaysModule],
})
export class AppModule {}

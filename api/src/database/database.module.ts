import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppConfigService } from '../config/app-config.service.js';
import { entities } from './entities.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        url: config.databaseUrl,
        entities,
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: false,
        autoLoadEntities: false,
        migrationsRun: false,
        logging: config.isProduction ? ['error', 'warn'] : ['error', 'warn'],
      }),
    }),
  ],
})
export class DatabaseModule {}

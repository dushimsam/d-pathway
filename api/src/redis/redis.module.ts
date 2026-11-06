import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { AppConfigService } from '../config/app-config.service.js';
import { CacheService } from './cache.service.js';
import { REDIS_CLIENT } from './redis.constants.js';

/**
 * Global Redis wiring: a shared ioredis client for caching, and the BullMQ
 * root connection for the event queue/worker.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: new Redis(config.redisUrl, {
          maxRetriesPerRequest: null,
        }),
      }),
    }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new Redis(config.redisUrl, { maxRetriesPerRequest: null }),
    },
    CacheService,
  ],
  exports: [REDIS_CLIENT, CacheService],
})
export class RedisModule {}

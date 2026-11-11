import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service.js';
import { configValidationSchema } from './config.schema.js';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Under test the harness injects config straight into process.env (random
      // Testcontainers ports, etc.). Reading a developer's .env here would let
      // its DATABASE_URL/REDIS_URL win over those and point the app at the wrong
      // services, so skip the file entirely in that mode.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validationSchema: configValidationSchema,
      // allowUnknown keeps process.env's many unrelated vars (and docker-compose's
      // POSTGRES_*) from failing validation; abortEarly:false reports all at once.
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      } as unknown as Record<string, never>,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}

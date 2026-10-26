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

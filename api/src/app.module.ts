import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { DatabaseModule } from './database/database.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { GraduatesModule } from './modules/graduates/graduates.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { CatalogueModule } from './modules/catalogue/catalogue.module.js';
import { ApplicationsModule } from './modules/applications/applications.module.js';
import { DeliverablesModule } from './modules/deliverables/deliverables.module.js';
import { EvaluationsModule } from './modules/evaluations/evaluations.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { DashboardsModule } from './modules/dashboards/dashboards.module.js';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.isProduction ? 'info' : 'debug',
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        },
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    GraduatesModule,
    CompaniesModule,
    ProjectsModule,
    CatalogueModule,
    ApplicationsModule,
    DeliverablesModule,
    EvaluationsModule,
    UploadsModule,
    DashboardsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

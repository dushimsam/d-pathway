import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { Deliverable } from '../deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../evaluations/entities/evaluation.entity.js';
import { DashboardsService } from './services/dashboards.service.js';
import { DashboardsController } from './controllers/dashboards.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliverable, Evaluation]),
    ApplicationsModule,
    ProjectsModule,
    CompaniesModule,
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraduatesModule } from '../graduates/graduates.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { Deliverable } from '../deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../evaluations/entities/evaluation.entity.js';
import { Application } from './entities/application.entity.js';
import { ApplicationsService } from './services/applications.service.js';
import { ApplicationsController } from './controllers/applications.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Deliverable, Evaluation]),
    GraduatesModule,
    CompaniesModule,
    ProjectsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

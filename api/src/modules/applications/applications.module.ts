import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraduatesModule } from '../graduates/graduates.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { Deliverable } from '../deliverables/entities/deliverable.entity.js';
import { Evaluation } from '../evaluations/entities/evaluation.entity.js';
import { Application } from './entities/application.entity.js';
import { ApplicationMembership } from './entities/application-membership.entity.js';
import { ApplicationsService } from './services/applications.service.js';
import { MembershipsService } from './services/memberships.service.js';
import { ApplicationsController } from './controllers/applications.controller.js';
import { MembershipsController } from './controllers/memberships.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      ApplicationMembership,
      Deliverable,
      Evaluation,
    ]),
    GraduatesModule,
    CompaniesModule,
    ProjectsModule,
  ],
  controllers: [ApplicationsController, MembershipsController],
  providers: [ApplicationsService, MembershipsService],
  exports: [ApplicationsService, MembershipsService],
})
export class ApplicationsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from '../companies/companies.module.js';
import { Application } from '../applications/entities/application.entity.js';
import { Project } from './entities/project.entity.js';
import { ProjectsService } from './services/projects.service.js';
import { ProjectsController } from './controllers/projects.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Application]),
    CompaniesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module.js';
import { GraduatesModule } from '../graduates/graduates.module.js';
import { Project } from '../projects/entities/project.entity.js';
import { SavedBrief } from './entities/saved-brief.entity.js';
import { CatalogueService } from './services/catalogue.service.js';
import { BookmarksService } from './services/bookmarks.service.js';
import { CatalogueController } from './controllers/catalogue.controller.js';

@Module({
  imports: [
    ProjectsModule,
    GraduatesModule,
    TypeOrmModule.forFeature([SavedBrief, Project]),
  ],
  controllers: [CatalogueController],
  providers: [CatalogueService, BookmarksService],
})
export class CatalogueModule {}

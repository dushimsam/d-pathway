import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { CatalogueService } from './services/catalogue.service.js';
import { CatalogueController } from './controllers/catalogue.controller.js';

@Module({
  imports: [ProjectsModule],
  controllers: [CatalogueController],
  providers: [CatalogueService],
})
export class CatalogueModule {}

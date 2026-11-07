import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CompaniesService } from './services/companies.service.js';
import { CompaniesController } from './controllers/companies.controller.js';
import { ReviewsModule } from '../reviews/reviews.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Project]), ReviewsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}

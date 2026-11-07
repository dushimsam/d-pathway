import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity.js';
import { Graduate } from '../graduates/entities/graduate.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CompanyReview } from './entities/company-review.entity.js';
import { ReviewsService } from './services/reviews.service.js';
import { ReviewsController } from './controllers/reviews.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyReview, Application, Project, Graduate]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliverablesModule } from '../deliverables/deliverables.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { Evaluation } from './entities/evaluation.entity.js';
import { EvaluationsService } from './services/evaluations.service.js';
import { EvaluationsController } from './controllers/evaluations.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evaluation]),
    DeliverablesModule,
    CompaniesModule,
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}

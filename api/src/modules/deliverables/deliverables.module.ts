import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module.js';
import { ActivityModule } from '../activity/activity.module.js';
import { Evaluation } from '../evaluations/entities/evaluation.entity.js';
import { Deliverable } from './entities/deliverable.entity.js';
import { DeliverablesService } from './services/deliverables.service.js';
import { DeliverablesController } from './controllers/deliverables.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliverable, Evaluation]),
    ApplicationsModule,
    ActivityModule,
  ],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}

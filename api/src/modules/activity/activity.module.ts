import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EVENTS_QUEUE } from '../../redis/redis.constants.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { GraduatesModule } from '../graduates/graduates.module.js';
import { Activity } from './entities/activity.entity.js';
import { ActivityController } from './controllers/activity.controller.js';
import { ActivityService } from './services/activity.service.js';
import { ActivityProcessor } from './services/activity.processor.js';
import { EventsPublisher } from './services/events.publisher.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    BullModule.registerQueue({ name: EVENTS_QUEUE }),
    CompaniesModule,
    GraduatesModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityProcessor, EventsPublisher],
  exports: [EventsPublisher],
})
export class ActivityModule {}

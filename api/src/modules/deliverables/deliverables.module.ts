import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module.js';
import { Deliverable } from './entities/deliverable.entity.js';
import { DeliverablesService } from './services/deliverables.service.js';
import { DeliverablesController } from './controllers/deliverables.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Deliverable]), ApplicationsModule],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Graduate } from '../graduates/entities/graduate.entity.js';
import { Evaluation } from '../evaluations/entities/evaluation.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { TalentService } from './services/talent.service.js';
import { TalentController } from './controllers/talent.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Graduate, Evaluation, Project])],
  controllers: [TalentController],
  providers: [TalentService],
})
export class TalentModule {}

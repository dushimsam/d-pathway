import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pathway } from './entities/pathway.entity.js';
import { PathwaysController } from './controllers/pathways.controller.js';
import { PathwaysService } from './services/pathways.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pathway])],
  controllers: [PathwaysController],
  providers: [PathwaysService],
})
export class PathwaysModule {}

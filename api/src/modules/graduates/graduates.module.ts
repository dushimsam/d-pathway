import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Graduate } from './entities/graduate.entity.js';
import { GraduatesService } from './services/graduates.service.js';
import { GraduatesController } from './controllers/graduates.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Graduate])],
  controllers: [GraduatesController],
  providers: [GraduatesService],
  exports: [GraduatesService],
})
export class GraduatesModule {}

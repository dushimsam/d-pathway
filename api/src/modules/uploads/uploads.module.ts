import { Module } from '@nestjs/common';
import { UploadsService } from './services/uploads.service.js';
import { UploadsController } from './controllers/uploads.controller.js';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

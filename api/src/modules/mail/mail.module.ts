import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity.js';
import { Graduate } from '../graduates/entities/graduate.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { MailService } from './mail.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Graduate, Company])],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

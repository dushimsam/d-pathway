import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../companies/entities/company.entity.js';
import { Graduate } from '../graduates/entities/graduate.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { WalletTransaction } from './entities/wallet-transaction.entity.js';
import { StripeService } from './services/stripe.service.js';
import { WalletService } from './services/wallet.service.js';
import { WalletController } from './controllers/wallet.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Graduate, Project, WalletTransaction]),
  ],
  controllers: [WalletController],
  providers: [StripeService, WalletService],
  exports: [WalletService],
})
export class WalletModule {}

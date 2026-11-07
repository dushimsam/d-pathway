import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { WalletService } from '../services/wallet.service.js';
import { TopUpDto } from '../dto/topup.dto.js';
import { WithdrawDto } from '../dto/withdraw.dto.js';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  // Any authenticated user; the service returns the company or student view.
  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.wallet.getWallet(user);
  }

  @Roles(UserRole.COMPANY)
  @Post('topup')
  topUp(@CurrentUser() user: AuthUser, @Body() dto: TopUpDto) {
    return this.wallet.createTopUp(user.id, dto.amount);
  }

  @Roles(UserRole.COMPANY)
  @Get('topup/confirm')
  confirm(@CurrentUser() user: AuthUser, @Query('session_id') sessionId: string) {
    return this.wallet.confirmTopUp(user.id, sessionId);
  }

  @Roles(UserRole.GRADUATE)
  @HttpCode(HttpStatus.OK)
  @Post('withdrawals')
  withdraw(@CurrentUser() user: AuthUser, @Body() dto: WithdrawDto) {
    return this.wallet.withdraw(user.id, dto.amount);
  }
}

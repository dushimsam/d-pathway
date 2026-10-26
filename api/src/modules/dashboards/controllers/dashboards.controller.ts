import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { DashboardsService } from '../services/dashboards.service.js';

@ApiTags('dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboards: DashboardsService) {}

  @Roles(UserRole.GRADUATE)
  @Get('graduate')
  graduate(@CurrentUser() user: AuthUser) {
    return this.dashboards.graduate(user.id);
  }

  @Roles(UserRole.COMPANY)
  @Get('company')
  company(@CurrentUser() user: AuthUser) {
    return this.dashboards.company(user.id);
  }
}

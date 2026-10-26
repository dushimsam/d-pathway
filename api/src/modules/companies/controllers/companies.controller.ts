import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { CompaniesService } from '../services/companies.service.js';
import { UpdateCompanyDto } from '../dto/update-company.dto.js';

@ApiTags('companies')
@ApiBearerAuth()
@Roles(UserRole.COMPANY)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.companies.getByUserIdOrThrow(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateCompanyDto) {
    return this.companies.updateMe(user.id, dto);
  }
}

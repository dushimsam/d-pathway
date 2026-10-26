import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { GraduatesService } from '../services/graduates.service.js';
import { UpdateGraduateDto } from '../dto/update-graduate.dto.js';

@ApiTags('graduates')
@ApiBearerAuth()
@Roles(UserRole.GRADUATE)
@Controller('graduates')
export class GraduatesController {
  constructor(private readonly graduates: GraduatesService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.graduates.getByUserIdOrThrow(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateGraduateDto) {
    return this.graduates.updateMe(user.id, dto);
  }
}

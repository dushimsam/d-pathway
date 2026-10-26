import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { ApplicationsService } from '../services/applications.service.js';
import { ApplyDto } from '../dto/apply.dto.js';
import { DeclineDto } from '../dto/decline.dto.js';

@ApiTags('applications')
@ApiBearerAuth()
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Roles(UserRole.GRADUATE)
  @Post('projects/:id/apply')
  apply(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: ApplyDto,
  ) {
    return this.applications.apply(user.id, projectId, dto);
  }

  @Roles(UserRole.GRADUATE)
  @Get('applications/mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.applications.listMine(user.id);
  }

  @Roles(UserRole.COMPANY)
  @Get('projects/:id/applications')
  reviewQueue(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) projectId: string,
  ) {
    return this.applications.reviewQueue(user.id, projectId);
  }

  @Roles(UserRole.COMPANY)
  @HttpCode(HttpStatus.OK)
  @Post('applications/:id/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applications.accept(user.id, id);
  }

  @Roles(UserRole.COMPANY)
  @HttpCode(HttpStatus.OK)
  @Post('applications/:id/decline')
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeclineDto,
  ) {
    return this.applications.decline(user.id, id, dto.reason);
  }
}

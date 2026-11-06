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
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { MembershipsService } from '../services/memberships.service.js';
import { InviteTeammateDto } from '../dto/invite-teammate.dto.js';

@ApiTags('teams')
@ApiBearerAuth()
@Controller()
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Roles(UserRole.GRADUATE)
  @Post('applications/:id/invitations')
  invite(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: InviteTeammateDto,
  ) {
    return this.memberships.invite(user.id, applicationId, dto.email);
  }

  // Lead or any teammate may read the roster.
  @Get('applications/:id/team')
  team(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
  ) {
    return this.memberships.team(user, applicationId);
  }

  @Roles(UserRole.GRADUATE)
  @Get('invitations/mine')
  myInvitations(@CurrentUser() user: AuthUser) {
    return this.memberships.myInvitations(user.id);
  }

  @Roles(UserRole.GRADUATE)
  @HttpCode(HttpStatus.OK)
  @Post('invitations/:id/accept')
  accept(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.memberships.respond(user.id, id, true);
  }

  @Roles(UserRole.GRADUATE)
  @HttpCode(HttpStatus.OK)
  @Post('invitations/:id/decline')
  decline(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.memberships.respond(user.id, id, false);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { DeliverablesService } from '../services/deliverables.service.js';
import { SubmitDeliverableDto } from '../dto/submit-deliverable.dto.js';

@ApiTags('deliverables')
@ApiBearerAuth()
@Controller()
export class DeliverablesController {
  constructor(private readonly deliverables: DeliverablesService) {}

  @Roles(UserRole.GRADUATE)
  @Post('applications/:id/deliverable')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: SubmitDeliverableDto,
  ) {
    return this.deliverables.submit(user.id, applicationId, dto);
  }

  // Graduate owner or owning company; enforced in the service.
  @Get('applications/:id/deliverable')
  getForApplication(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) applicationId: string,
  ) {
    return this.deliverables.getForApplication(user, applicationId);
  }

  // Single deliverable by id (evaluation screen); graduate owner or owning company.
  @Get('deliverables/:id')
  getById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliverables.getByIdForUser(user, id);
  }
}

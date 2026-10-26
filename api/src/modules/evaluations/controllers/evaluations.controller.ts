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
import { EvaluationsService } from '../services/evaluations.service.js';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto.js';

@ApiTags('evaluations')
@ApiBearerAuth()
@Controller('deliverables')
export class EvaluationsController {
  constructor(private readonly evaluations: EvaluationsService) {}

  @Roles(UserRole.COMPANY)
  @Post(':id/evaluation')
  create(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) deliverableId: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluations.create(user.id, deliverableId, dto);
  }

  // Concerned graduate or owning company; enforced in the service (V3).
  @Get(':id/evaluation')
  getForDeliverable(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) deliverableId: string,
  ) {
    return this.evaluations.getForDeliverable(user, deliverableId);
  }
}

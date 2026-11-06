import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator.js';
import { ActivityService } from '../services/activity.service.js';

@ApiTags('activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  // Any authenticated user; the service scopes the feed to their role.
  @Get()
  feed(@CurrentUser() user: AuthUser) {
    return this.activity.feedForUser(user);
  }
}

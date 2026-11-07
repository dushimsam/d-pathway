import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { TalentService } from '../services/talent.service.js';

@ApiTags('talent')
@ApiBearerAuth()
@Roles(UserRole.COMPANY)
@Controller('talent')
export class TalentController {
  constructor(private readonly talent: TalentService) {}

  // Public portfolio: the same profile, shareable and open to anyone.
  @Public()
  @Roles()
  @Get(':id/public')
  publicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.talent.profile(id);
  }

  @Get()
  search(
    @Query('skill') skill?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.talent.search({
      skill: skill || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  profile(@Param('id', ParseUUIDPipe) id: string) {
    return this.talent.profile(id);
  }
}

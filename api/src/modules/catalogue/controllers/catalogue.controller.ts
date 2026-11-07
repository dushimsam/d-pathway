import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CatalogueService } from '../services/catalogue.service.js';
import { BookmarksService } from '../services/bookmarks.service.js';
import { CatalogueQueryDto } from '../dto/catalogue-query.dto.js';
import { SaveBriefDto } from '../dto/save-brief.dto.js';

@ApiTags('catalogue')
@ApiBearerAuth()
@Roles(UserRole.GRADUATE)
@Controller('catalogue')
export class CatalogueController {
  constructor(
    private readonly catalogue: CatalogueService,
    private readonly bookmarks: BookmarksService,
  ) {}

  @Get('projects')
  listProjects(@Query() query: CatalogueQueryDto) {
    return this.catalogue.listProjects(query);
  }

  @Get('companies')
  listCompanies() {
    return this.catalogue.listCompanies();
  }

  // --- bookmarks ---
  @Get('saved')
  listSaved(@CurrentUser() user: AuthUser) {
    return this.bookmarks.list(user.id);
  }

  @Get('saved/ids')
  listSavedIds(@CurrentUser() user: AuthUser) {
    return this.bookmarks.listIds(user.id);
  }

  @Post('saved')
  save(@CurrentUser() user: AuthUser, @Body() dto: SaveBriefDto) {
    return this.bookmarks.save(user.id, dto.projectId);
  }

  @Delete('saved/:projectId')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.bookmarks.remove(user.id, projectId);
  }
}

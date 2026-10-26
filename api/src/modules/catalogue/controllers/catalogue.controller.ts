import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { CatalogueService } from '../services/catalogue.service.js';
import { CatalogueQueryDto } from '../dto/catalogue-query.dto.js';

@ApiTags('catalogue')
@ApiBearerAuth()
@Roles(UserRole.GRADUATE)
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('projects')
  listProjects(@Query() query: CatalogueQueryDto) {
    return this.catalogue.listProjects(query);
  }

  @Get('companies')
  listCompanies() {
    return this.catalogue.listCompanies();
  }
}

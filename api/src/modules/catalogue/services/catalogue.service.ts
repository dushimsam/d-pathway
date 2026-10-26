import { Injectable } from '@nestjs/common';
import { paginate, type PaginatedResult } from '../../../common/dto/pagination-query.dto.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import type { Project } from '../../projects/entities/project.entity.js';
import { CatalogueQueryDto } from '../dto/catalogue-query.dto.js';

@Injectable()
export class CatalogueService {
  constructor(private readonly projects: ProjectsService) {}

  async listProjects(query: CatalogueQueryDto): Promise<PaginatedResult<Project>> {
    const { items, total } = await this.projects.catalogue({
      companyId: query.companyId,
      skill: query.skill,
      hasPrize: query.hasPrize,
      page: query.page,
      pageSize: query.pageSize,
    });
    return paginate(items, total, query.page, query.pageSize);
  }

  listCompanies() {
    return this.projects.companiesWithOpenProjects();
  }
}

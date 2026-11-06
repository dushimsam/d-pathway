import { Injectable } from '@nestjs/common';
import { paginate, type PaginatedResult } from '../../../common/dto/pagination-query.dto.js';
import { CacheService } from '../../../redis/cache.service.js';
import { CATALOGUE_CACHE_PREFIX } from '../../../redis/redis.constants.js';
import { ProjectsService } from '../../projects/services/projects.service.js';
import type { Project } from '../../projects/entities/project.entity.js';
import { CatalogueQueryDto } from '../dto/catalogue-query.dto.js';

@Injectable()
export class CatalogueService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly cache: CacheService,
  ) {}

  async listProjects(query: CatalogueQueryDto): Promise<PaginatedResult<Project>> {
    const key = `${CATALOGUE_CACHE_PREFIX}projects:${this.fingerprint(query)}`;
    return this.cache.wrap(key, 30, async () => {
      const { items, total } = await this.projects.catalogue({
        companyId: query.companyId,
        skill: query.skill,
        hasPrize: query.hasPrize,
        page: query.page,
        pageSize: query.pageSize,
      });
      return paginate(items, total, query.page, query.pageSize);
    });
  }

  listCompanies() {
    return this.cache.wrap(`${CATALOGUE_CACHE_PREFIX}companies`, 60, () =>
      this.projects.companiesWithOpenProjects(),
    );
  }

  private fingerprint(q: CatalogueQueryDto): string {
    return [
      q.companyId ?? '',
      q.skill ?? '',
      q.hasPrize ?? '',
      q.page ?? 1,
      q.pageSize ?? 20,
    ].join('|');
  }
}

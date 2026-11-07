import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ApplicationStatus,
  PrizeStatus,
  ProjectStatus,
} from '../../../common/enums/index.js';
import { CacheService } from '../../../redis/cache.service.js';
import { CATALOGUE_CACHE_PREFIX } from '../../../redis/redis.constants.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { WalletService } from '../../wallet/services/wallet.service.js';
import { EventsPublisher } from '../../activity/services/events.publisher.js';
import { Application } from '../../applications/entities/application.entity.js';
import { Project } from '../entities/project.entity.js';
import { CreateProjectDto } from '../dto/create-project.dto.js';
import { UpdateProjectDto } from '../dto/update-project.dto.js';
import {
  assertClosable,
  assertDeletable,
  assertEditable,
  assertPublishable,
  assertPublishableState,
  hasApplicationDeadlinePassed,
} from '../rules/project.rules.js';

const GRADUATE_VISIBLE_STATUSES = [
  ProjectStatus.OPEN,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.CLOSED,
];

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    // Read-only: application counts for the company's own-projects view. Writes
    // to applications go through ApplicationsService.
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    private readonly companies: CompaniesService,
    private readonly cache: CacheService,
    private readonly wallet: WalletService,
    private readonly dataSource: DataSource,
    private readonly events: EventsPublisher,
  ) {}

  /** Drop every cached catalogue page after a write that changes what's listed. */
  private invalidateCatalogue(): Promise<void> {
    return this.cache.invalidatePrefix(CATALOGUE_CACHE_PREFIX);
  }

  /** Counts of applications grouped by status for each of the given projects. */
  private async countsByStatusForProjects(
    projectIds: string[],
  ): Promise<Record<string, Record<string, number>>> {
    const result: Record<string, Record<string, number>> = {};
    if (projectIds.length === 0) return result;
    const rows = await this.applications
      .createQueryBuilder('a')
      .select('a.project_id', 'projectId')
      .addSelect('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.project_id IN (:...ids)', { ids: projectIds })
      .groupBy('a.project_id')
      .addGroupBy('a.status')
      .getRawMany<{ projectId: string; status: string; count: string }>();
    for (const row of rows) {
      result[row.projectId] ??= {};
      result[row.projectId][row.status] = Number(row.count);
    }
    return result;
  }

  private static normaliseSkills(skills: string[]): string[] {
    return skills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  }

  private async companyIdForUser(userId: string): Promise<string> {
    const company = await this.companies.getByUserIdOrThrow(userId);
    return company.id;
  }

  async findByIdOrThrow(id: string): Promise<Project> {
    const project = await this.projects.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  assertOwnedByCompany(project: Project, companyId: string): void {
    if (project.companyId !== companyId) {
      throw new ForbiddenException('You do not own this project.');
    }
  }

  save(project: Project): Promise<Project> {
    return this.projects.save(project);
  }

  /** P4: lazily flip an OPEN project to IN_PROGRESS once its deadline passes. */
  async ensureDeadlineTransition(project: Project, now = new Date()): Promise<Project> {
    if (
      project.status === ProjectStatus.OPEN &&
      hasApplicationDeadlinePassed(project, now)
    ) {
      project.status = ProjectStatus.IN_PROGRESS;
      const saved = await this.projects.save(project);
      await this.invalidateCatalogue();
      return saved;
    }
    return project;
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const companyId = await this.companyIdForUser(userId);
    const hasPrize = dto.prizeAmount != null && dto.prizeAmount > 0;

    // A prized project escrows the prize out of the company's balance at creation,
    // so a company can never commit more prize money than it has topped up.
    const saved = await this.dataSource.transaction(async (m) => {
      const project = m.create(Project, {
        companyId,
        title: dto.title,
        brief: dto.brief,
        requiredSkills: ProjectsService.normaliseSkills(dto.requiredSkills),
        applicationDeadline: new Date(dto.applicationDeadline),
        submissionDeadline: new Date(dto.submissionDeadline),
        deliverableFormat: dto.deliverableFormat,
        ipTerms: dto.ipTerms,
        prizeAmount: hasPrize ? dto.prizeAmount! : null,
        prizeCurrency: hasPrize ? dto.prizeCurrency ?? 'RWF' : null,
        prizeStatus: hasPrize ? PrizeStatus.HELD : null,
        coverImageUrl: dto.coverImageUrl ?? null,
        coverImagePublicId: dto.coverImagePublicId ?? null,
        status: ProjectStatus.DRAFT,
        publishedAt: null,
      });
      const created = await m.save(project);
      if (hasPrize) {
        await this.wallet.holdPrize(m, companyId, dto.prizeAmount!, created.id, created.title);
      }
      return created;
    });

    await this.invalidateCatalogue();
    return saved;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto): Promise<Project> {
    const companyId = await this.companyIdForUser(userId);

    const saved = await this.dataSource.transaction(async (m) => {
      const project = await m.findOne(Project, { where: { id } });
      if (!project) throw new NotFoundException('Project not found.');
      this.assertOwnedByCompany(project, companyId);
      assertEditable(project); // P2 / P-LOCK

      if (dto.title !== undefined) project.title = dto.title;
      if (dto.brief !== undefined) project.brief = dto.brief;
      if (dto.requiredSkills !== undefined)
        project.requiredSkills = ProjectsService.normaliseSkills(dto.requiredSkills);
      if (dto.applicationDeadline !== undefined)
        project.applicationDeadline = new Date(dto.applicationDeadline);
      if (dto.submissionDeadline !== undefined)
        project.submissionDeadline = new Date(dto.submissionDeadline);
      if (dto.deliverableFormat !== undefined)
        project.deliverableFormat = dto.deliverableFormat;
      if (dto.ipTerms !== undefined) project.ipTerms = dto.ipTerms;

      // Re-escrow when the prize changes: refund the old hold, hold the new amount.
      if (dto.prizeAmount !== undefined) {
        const held = project.prizeStatus === PrizeStatus.HELD ? project.prizeAmount ?? 0 : 0;
        const desired = dto.prizeAmount != null && dto.prizeAmount > 0 ? dto.prizeAmount : 0;
        if (held !== desired) {
          if (held > 0) await this.wallet.refundPrize(m, companyId, held, id, project.title);
          if (desired > 0) await this.wallet.holdPrize(m, companyId, desired, id, project.title);
        }
        project.prizeAmount = desired > 0 ? desired : null;
        project.prizeCurrency = desired > 0 ? dto.prizeCurrency ?? project.prizeCurrency ?? 'RWF' : null;
        project.prizeStatus = desired > 0 ? PrizeStatus.HELD : null;
      }

      if (dto.coverImageUrl !== undefined) project.coverImageUrl = dto.coverImageUrl;
      if (dto.coverImagePublicId !== undefined)
        project.coverImagePublicId = dto.coverImagePublicId;

      return m.save(project);
    });

    await this.invalidateCatalogue();
    return saved;
  }

  async publish(userId: string, id: string): Promise<Project> {
    const companyId = await this.companyIdForUser(userId);
    const project = await this.findByIdOrThrow(id);
    this.assertOwnedByCompany(project, companyId);
    assertPublishableState(project);
    assertPublishable(project, new Date()); // P3
    project.status = ProjectStatus.OPEN;
    project.publishedAt = new Date();
    const saved = await this.projects.save(project);
    await this.invalidateCatalogue();
    return saved;
  }

  async close(userId: string, id: string): Promise<Project> {
    const companyId = await this.companyIdForUser(userId);
    const project = await this.findByIdOrThrow(id);
    this.assertOwnedByCompany(project, companyId);
    assertClosable(project);
    project.status = ProjectStatus.CLOSED;
    const saved = await this.projects.save(project);
    await this.invalidateCatalogue();
    return saved;
  }

  /**
   * Delete a project the company owns. Blocked once any applicant has been
   * accepted (P-DEL) — a selected team has committed to the work. Pending and
   * declined applications (and any team invitations) are removed with it via the
   * database's ON DELETE CASCADE.
   */
  async remove(userId: string, id: string): Promise<{ id: string }> {
    const companyId = await this.companyIdForUser(userId);
    const project = await this.findByIdOrThrow(id);
    this.assertOwnedByCompany(project, companyId);

    const accepted = await this.applications.count({
      where: { projectId: id, status: ApplicationStatus.ACCEPTED },
    });
    assertDeletable(accepted); // P-DEL

    await this.dataSource.transaction(async (m) => {
      // Return any still-held prize to the company before removing the project.
      if (project.prizeStatus === PrizeStatus.HELD && project.prizeAmount) {
        await this.wallet.refundPrize(m, companyId, project.prizeAmount, id, project.title);
      }
      await m.delete(Project, id);
    });

    await this.invalidateCatalogue();
    return { id };
  }

  /**
   * P-AWARD: complete the project for one accepted student and release the held
   * prize to their balance. The project closes; the prize can be awarded once.
   */
  async award(userId: string, id: string, graduateId: string): Promise<Project> {
    const companyId = await this.companyIdForUser(userId);

    const saved = await this.dataSource.transaction(async (m) => {
      const project = await m.findOne(Project, { where: { id } });
      if (!project) throw new NotFoundException('Project not found.');
      this.assertOwnedByCompany(project, companyId);

      if (project.prizeStatus !== PrizeStatus.HELD || !project.prizeAmount) {
        throw new ConflictException('This project has no held prize to award.');
      }

      // The winner must be an accepted applicant on this project.
      const accepted = await m.findOne(Application, {
        where: { projectId: id, graduateId, status: ApplicationStatus.ACCEPTED },
      });
      if (!accepted) {
        throw new ForbiddenException('You can only award an accepted applicant.');
      }

      await this.wallet.releasePrize(m, graduateId, project.prizeAmount, id, project.title);
      project.prizeStatus = PrizeStatus.RELEASED;
      project.winnerGraduateId = graduateId;
      project.status = ProjectStatus.CLOSED;
      return m.save(project);
    });

    await this.invalidateCatalogue();

    if (saved.prizeAmount) {
      const company = await this.companies.findById(saved.companyId);
      await this.events.prizeAwarded({
        graduateId,
        companyName: company?.name ?? 'A company',
        projectId: saved.id,
        projectTitle: saved.title,
        amount: saved.prizeAmount,
        currency: saved.prizeCurrency ?? 'rwf',
      });
    }
    return saved;
  }

  async listMine(userId: string): Promise<
    Array<Project & { applicationCounts: Record<string, number> }>
  > {
    const companyId = await this.companyIdForUser(userId);
    const own = await this.projects.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    const transitioned = await Promise.all(
      own.map((p) => this.ensureDeadlineTransition(p, now)),
    );
    const counts = await this.countsByStatusForProjects(
      transitioned.map((p) => p.id),
    );
    return transitioned.map((p) => ({
      ...p,
      applicationCounts: counts[p.id] ?? {},
    }));
  }

  /**
   * The public catalogue: only genuinely-open projects (status OPEN and the
   * application deadline still in the future), newest first, with optional
   * company and skill filters. Used by the catalogue module.
   */
  async catalogue(filters: {
    companyId?: string;
    skill?: string;
    hasPrize?: boolean;
    page: number;
    pageSize: number;
  }): Promise<{ items: Project[]; total: number }> {
    const qb = this.projects
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.company', 'company')
      .where('project.status = :status', { status: ProjectStatus.OPEN })
      .andWhere('project.applicationDeadline > :now', { now: new Date() });

    if (filters.companyId) {
      qb.andWhere('project.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }
    if (filters.skill) {
      qb.andWhere(':skill = ANY(project.requiredSkills)', {
        skill: filters.skill.trim().toLowerCase(),
      });
    }
    if (filters.hasPrize) {
      qb.andWhere('project.prizeAmount IS NOT NULL');
    }

    // Prized projects first, then newest.
    qb.orderBy('project.publishedAt', 'DESC')
      .addOrderBy('project.createdAt', 'DESC')
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /** Distinct companies that currently have at least one open project. */
  async companiesWithOpenProjects(): Promise<
    Array<{ id: string; name: string; industry: string | null }>
  > {
    const rows = await this.projects
      .createQueryBuilder('project')
      .innerJoin('project.company', 'company')
      .select('company.id', 'id')
      .addSelect('company.name', 'name')
      .addSelect('company.industry', 'industry')
      .where('project.status = :status', { status: ProjectStatus.OPEN })
      .andWhere('project.applicationDeadline > :now', { now: new Date() })
      .groupBy('company.id')
      .addGroupBy('company.name')
      .addGroupBy('company.industry')
      .orderBy('company.name', 'ASC')
      .getRawMany<{ id: string; name: string; industry: string | null }>();
    return rows;
  }

  /** Role-aware single project. Graduates see only published projects. */
  async getOneForUser(
    user: { id: string; role: string },
    id: string,
  ): Promise<Project> {
    const project = await this.findByIdOrThrow(id);
    if (user.role === 'COMPANY') {
      const companyId = await this.companyIdForUser(user.id);
      this.assertOwnedByCompany(project, companyId);
      return this.ensureDeadlineTransition(project);
    }
    // Graduate view: only published statuses.
    const current = await this.ensureDeadlineTransition(project);
    if (!GRADUATE_VISIBLE_STATUSES.includes(current.status)) {
      throw new NotFoundException('Project not found.');
    }
    return current;
  }
}

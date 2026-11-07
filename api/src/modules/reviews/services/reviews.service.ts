import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicationStatus } from '../../../common/enums/index.js';
import { Application } from '../../applications/entities/application.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { CompanyReview } from '../entities/company-review.entity.js';
import { CreateReviewDto } from '../dto/create-review.dto.js';

export interface RatingSummary {
  average: number;
  count: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(CompanyReview)
    private readonly reviews: Repository<CompanyReview>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(Graduate)
    private readonly graduates: Repository<Graduate>,
  ) {}

  /** A graduate rates a company for a brief they were accepted onto. */
  async create(userId: string, dto: CreateReviewDto): Promise<CompanyReview> {
    const graduate = await this.graduates.findOne({ where: { userId } });
    if (!graduate) throw new NotFoundException('Graduate profile not found.');

    const project = await this.projects.findOne({
      where: { id: dto.projectId },
    });
    if (!project) throw new NotFoundException('Project not found.');

    // Only someone who actually worked the brief may review the company.
    const accepted = await this.applications.findOne({
      where: {
        projectId: dto.projectId,
        graduateId: graduate.id,
        status: ApplicationStatus.ACCEPTED,
      },
    });
    if (!accepted) {
      throw new ForbiddenException(
        'You can only review a company for a brief you were selected on.',
      );
    }

    const existing = await this.reviews.findOne({
      where: { graduateId: graduate.id, projectId: dto.projectId },
    });
    if (existing) {
      throw new ConflictException(
        'You have already reviewed this company for this brief.',
      );
    }

    const review = this.reviews.create({
      companyId: project.companyId,
      graduateId: graduate.id,
      projectId: dto.projectId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
    return this.reviews.save(review);
  }

  /** The reviews this graduate has already written, keyed for quick UI lookup. */
  async listMine(
    userId: string,
  ): Promise<Array<{ projectId: string; rating: number }>> {
    const graduate = await this.graduates.findOne({ where: { userId } });
    if (!graduate) return [];
    const rows = await this.reviews.find({
      where: { graduateId: graduate.id },
      select: { projectId: true, rating: true },
    });
    return rows.map((r) => ({ projectId: r.projectId, rating: r.rating }));
  }

  /** Public list of a company's reviews with its aggregate rating. */
  async listForCompany(companyId: string): Promise<{
    summary: RatingSummary;
    items: Array<{
      id: string;
      rating: number;
      comment: string | null;
      graduateName: string;
      projectTitle: string;
      createdAt: Date;
    }>;
  }> {
    const rows = await this.reviews.find({
      where: { companyId },
      relations: { graduate: true, project: true },
      order: { createdAt: 'DESC' },
    });
    const count = rows.length;
    const average =
      count === 0
        ? 0
        : Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
    return {
      summary: { average, count },
      items: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        graduateName: r.graduate?.fullName ?? 'A graduate',
        projectTitle: r.project?.title ?? 'A brief',
        createdAt: r.createdAt,
      })),
    };
  }

  /** Aggregate rating per company id — for catalogue / list cards. */
  async summaryFor(companyIds: string[]): Promise<Map<string, RatingSummary>> {
    const out = new Map<string, RatingSummary>();
    if (companyIds.length === 0) return out;
    const rows = await this.reviews.find({
      where: { companyId: In(companyIds) },
      select: { companyId: true, rating: true },
    });
    const acc = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      const a = acc.get(r.companyId) ?? { sum: 0, count: 0 };
      a.sum += r.rating;
      a.count += 1;
      acc.set(r.companyId, a);
    }
    for (const [id, a] of acc) {
      out.set(id, {
        average: Math.round((a.sum / a.count) * 10) / 10,
        count: a.count,
      });
    }
    return out;
  }
}

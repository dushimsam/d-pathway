import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { ProjectStatus } from '../../../common/enums/index.js';
import { Company } from '../entities/company.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { UpdateCompanyDto } from '../dto/update-company.dto.js';
import { ReviewsService } from '../../reviews/services/reviews.service.js';

export interface CreateCompanyData {
  name: string;
  industry?: string | null;
  representativeTitle?: string | null;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
    // Read-only: open briefs shown on the public company page.
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly reviews: ReviewsService,
  ) {}

  /**
   * Create the company for a freshly-registered member. In the pilot one member
   * owns one company; a duplicate name is a conflict.
   */
  async createForUser(
    userId: string,
    data: CreateCompanyData,
    manager?: EntityManager,
  ): Promise<Company> {
    const repo = manager ? manager.getRepository(Company) : this.companies;
    const existing = await repo.findOne({ where: { name: data.name } });
    if (existing) {
      throw new ConflictException(
        'A company with this name is already registered.',
      );
    }
    const company = repo.create({
      userId,
      name: data.name,
      industry: data.industry ?? null,
      representativeTitle: data.representativeTitle ?? null,
      description: null,
    });
    return repo.save(company);
  }

  async findByUserId(userId: string): Promise<Company | null> {
    return this.companies.findOne({ where: { userId } });
  }

  async getByUserIdOrThrow(userId: string): Promise<Company> {
    const company = await this.findByUserId(userId);
    if (!company) throw new NotFoundException('Company profile not found.');
    return company;
  }

  async findById(id: string): Promise<Company | null> {
    return this.companies.findOne({ where: { id } });
  }

  async updateMe(userId: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.getByUserIdOrThrow(userId);
    if (dto.name !== undefined && dto.name.trim() && dto.name !== company.name) {
      const clash = await this.companies.findOne({
        where: { name: dto.name.trim(), id: Not(company.id) },
      });
      if (clash) {
        throw new ConflictException('A company with this name already exists.');
      }
      company.name = dto.name.trim();
    }
    if (dto.industry !== undefined) company.industry = dto.industry;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.representativeTitle !== undefined)
      company.representativeTitle = dto.representativeTitle;
    if (dto.logoUrl !== undefined) company.logoUrl = dto.logoUrl || null;
    if (dto.logoPublicId !== undefined)
      company.logoPublicId = dto.logoPublicId || null;
    if (dto.website !== undefined) company.website = dto.website || null;
    if (dto.location !== undefined) company.location = dto.location || null;
    if (dto.size !== undefined) company.size = dto.size || null;
    return this.companies.save(company);
  }

  /** Public profile: safe company fields + its open briefs. */
  async getPublicProfile(id: string): Promise<unknown> {
    const company = await this.findById(id);
    if (!company) throw new NotFoundException('Company not found.');
    const projects = await this.projects.find({
      where: { companyId: id, status: ProjectStatus.OPEN },
      order: { createdAt: 'DESC' },
      take: 24,
    });
    const rating = (await this.reviews.summaryFor([id])).get(id) ?? {
      average: 0,
      count: 0,
    };
    return {
      id: company.id,
      name: company.name,
      industry: company.industry,
      description: company.description,
      logoUrl: company.logoUrl,
      website: company.website,
      location: company.location,
      size: company.size,
      rating,
      openProjects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        requiredSkills: p.requiredSkills,
        prizeAmount: p.prizeAmount,
        prizeCurrency: p.prizeCurrency,
        applicationDeadline: p.applicationDeadline,
        coverImageUrl: p.coverImageUrl,
      })),
    };
  }
}

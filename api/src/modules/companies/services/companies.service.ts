import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Company } from '../entities/company.entity.js';
import { UpdateCompanyDto } from '../dto/update-company.dto.js';

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
    if (dto.industry !== undefined) company.industry = dto.industry;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.representativeTitle !== undefined)
      company.representativeTitle = dto.representativeTitle;
    return this.companies.save(company);
  }
}

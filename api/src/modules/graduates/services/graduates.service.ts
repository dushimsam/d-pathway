import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Graduate } from '../entities/graduate.entity.js';
import { UpdateGraduateDto } from '../dto/update-graduate.dto.js';

export interface CreateGraduateData {
  fullName: string;
  education?: string | null;
  skills?: string[];
  links?: string[];
  location?: string | null;
}

@Injectable()
export class GraduatesService {
  constructor(
    @InjectRepository(Graduate)
    private readonly graduates: Repository<Graduate>,
  ) {}

  private static normaliseSkills(skills?: string[]): string[] {
    return (skills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  }

  /** Create the graduate profile for a freshly-registered user. */
  async createForUser(
    userId: string,
    data: CreateGraduateData,
    manager?: EntityManager,
  ): Promise<Graduate> {
    const repo = manager ? manager.getRepository(Graduate) : this.graduates;
    const graduate = repo.create({
      userId,
      fullName: data.fullName,
      education: data.education ?? null,
      skills: GraduatesService.normaliseSkills(data.skills),
      links: data.links ?? [],
      location: data.location ?? null,
    });
    return repo.save(graduate);
  }

  async findByUserId(userId: string): Promise<Graduate | null> {
    return this.graduates.findOne({ where: { userId } });
  }

  async getByUserIdOrThrow(userId: string): Promise<Graduate> {
    const graduate = await this.findByUserId(userId);
    if (!graduate) throw new NotFoundException('Graduate profile not found.');
    return graduate;
  }

  async updateMe(userId: string, dto: UpdateGraduateDto): Promise<Graduate> {
    const graduate = await this.getByUserIdOrThrow(userId);
    if (dto.fullName !== undefined) graduate.fullName = dto.fullName;
    if (dto.education !== undefined) graduate.education = dto.education;
    if (dto.skills !== undefined)
      graduate.skills = GraduatesService.normaliseSkills(dto.skills);
    if (dto.links !== undefined) graduate.links = dto.links;
    if (dto.location !== undefined) graduate.location = dto.location;
    return this.graduates.save(graduate);
  }
}

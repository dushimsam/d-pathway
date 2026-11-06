import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityType } from '../../../common/enums/index.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { GraduatesService } from '../../graduates/services/graduates.service.js';
import { Activity } from '../entities/activity.entity.js';

export interface RecordActivityInput {
  type: ActivityType;
  message: string;
  companyId: string | null;
  graduateId: string | null;
  projectId: string | null;
  meta?: Record<string, unknown> | null;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    private readonly companies: CompaniesService,
    private readonly graduates: GraduatesService,
  ) {}

  /** Called by the worker; persists one activity row. */
  async record(input: RecordActivityInput): Promise<Activity> {
    const activity = this.activities.create({
      type: input.type,
      message: input.message,
      companyId: input.companyId,
      graduateId: input.graduateId,
      projectId: input.projectId,
      meta: input.meta ?? null,
    });
    return this.activities.save(activity);
  }

  /** Role-aware feed: a company sees its own activity, a graduate theirs. */
  async feedForUser(user: { id: string; role: string }): Promise<Activity[]> {
    if (user.role === 'COMPANY') {
      const company = await this.companies.getByUserIdOrThrow(user.id);
      return this.activities.find({
        where: { companyId: company.id },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    }
    const graduate = await this.graduates.getByUserIdOrThrow(user.id);
    return this.activities.find({
      where: { graduateId: graduate.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}

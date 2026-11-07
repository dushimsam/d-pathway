import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GraduatesService } from '../../graduates/services/graduates.service.js';
import { Project } from '../../projects/entities/project.entity.js';
import { SavedBrief } from '../entities/saved-brief.entity.js';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(SavedBrief)
    private readonly saved: Repository<SavedBrief>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly graduates: GraduatesService,
  ) {}

  /** Bookmark a brief. Idempotent — saving twice is a no-op. */
  async save(userId: string, projectId: string): Promise<{ saved: true }> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const project = await this.projects.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    const existing = await this.saved.findOne({
      where: { graduateId: graduate.id, projectId },
    });
    if (!existing) {
      await this.saved.save(
        this.saved.create({ graduateId: graduate.id, projectId }),
      );
    }
    return { saved: true };
  }

  async remove(userId: string, projectId: string): Promise<{ saved: false }> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    await this.saved.delete({ graduateId: graduate.id, projectId });
    return { saved: false };
  }

  /** The ids of briefs this graduate has saved — for quick UI lookups. */
  async listIds(userId: string): Promise<string[]> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const rows = await this.saved.find({
      where: { graduateId: graduate.id },
      select: { projectId: true },
    });
    return rows.map((r) => r.projectId);
  }

  /** The saved briefs with full project detail, newest-saved first. */
  async list(userId: string): Promise<Project[]> {
    const graduate = await this.graduates.getByUserIdOrThrow(userId);
    const rows = await this.saved.find({
      where: { graduateId: graduate.id },
      order: { createdAt: 'DESC' },
    });
    const ids = rows.map((r) => r.projectId);
    if (ids.length === 0) return [];
    const projects = await this.projects.find({
      where: { id: In(ids) },
      relations: { company: true },
    });
    // Preserve saved-order.
    const byId = new Map(projects.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Project => !!p);
  }
}

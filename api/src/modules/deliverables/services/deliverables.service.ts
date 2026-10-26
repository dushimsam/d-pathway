import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsService } from '../../applications/services/applications.service.js';
import { Deliverable } from '../entities/deliverable.entity.js';
import { SubmitDeliverableDto } from '../dto/submit-deliverable.dto.js';
import {
  assertApplicationAccepted,
  assertBeforeSubmissionDeadline,
  assertHasTarget,
} from '../rules/deliverable.rules.js';
import type { Application } from '../../applications/entities/application.entity.js';

@Injectable()
export class DeliverablesService {
  constructor(
    @InjectRepository(Deliverable)
    private readonly deliverables: Repository<Deliverable>,
    private readonly applications: ApplicationsService,
  ) {}

  /**
   * Submit (or, before the deadline, replace) the single deliverable for an
   * accepted application. D1–D4 are enforced server-side regardless of client.
   */
  async submit(
    userId: string,
    applicationId: string,
    dto: SubmitDeliverableDto,
  ): Promise<Deliverable> {
    const application = await this.applications.loadForOwningGraduate(
      userId,
      applicationId,
    );
    assertApplicationAccepted(application.status); // D1
    assertBeforeSubmissionDeadline(
      application.project.submissionDeadline,
      new Date(),
    ); // D2
    assertHasTarget(dto.linkUrl, dto.fileUrl); // D4

    // D3: one deliverable per application; before the deadline replace in place.
    const existing = await this.deliverables.findOne({ where: { applicationId } });
    const deliverable =
      existing ??
      this.deliverables.create({ applicationId });
    deliverable.linkUrl = dto.linkUrl ?? null;
    deliverable.fileUrl = dto.fileUrl ?? null;
    deliverable.filePublicId = dto.filePublicId ?? null;
    deliverable.note = dto.note;
    deliverable.submittedAt = new Date();
    return this.deliverables.save(deliverable);
  }

  /** Role-aware read: graduate owner or the owning company. */
  async getForApplication(
    user: { id: string; role: string },
    applicationId: string,
  ): Promise<Deliverable> {
    const application: Application =
      user.role === 'COMPANY'
        ? (await this.applications.loadForOwningCompany(user.id, applicationId))
            .application
        : await this.applications.loadForOwningGraduate(user.id, applicationId);

    const deliverable = await this.deliverables.findOne({
      where: { applicationId: application.id },
    });
    if (!deliverable) {
      throw new NotFoundException('No deliverable submitted for this application.');
    }
    return deliverable;
  }

  async findByApplicationId(applicationId: string): Promise<Deliverable | null> {
    return this.deliverables.findOne({ where: { applicationId } });
  }

  /** Role-aware read by deliverable id (used by the evaluation screen). */
  async getByIdForUser(
    user: { id: string; role: string },
    id: string,
  ): Promise<Deliverable> {
    const deliverable = await this.getByIdWithChain(id);
    if (user.role === 'COMPANY') {
      const owningCompanyUserId = deliverable.application.project.company.userId;
      if (owningCompanyUserId !== user.id) {
        throw new NotFoundException('Deliverable not found.');
      }
    } else if (deliverable.application.graduate.userId !== user.id) {
      throw new NotFoundException('Deliverable not found.');
    }
    return deliverable;
  }

  /** Load a deliverable with its application → project → company chain. */
  async getByIdWithChain(id: string): Promise<Deliverable> {
    const deliverable = await this.deliverables.findOne({
      where: { id },
      relations: { application: { project: { company: true }, graduate: true } },
    });
    if (!deliverable) throw new NotFoundException('Deliverable not found.');
    return deliverable;
  }
}

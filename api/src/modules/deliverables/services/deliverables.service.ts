import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationsService } from '../../applications/services/applications.service.js';
import { EventsPublisher } from '../../activity/services/events.publisher.js';
import { Evaluation } from '../../evaluations/entities/evaluation.entity.js';
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
    // Resubmission flips any existing evaluation to stale; writes to the
    // evaluation proper still go through EvaluationsService.
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    private readonly applications: ApplicationsService,
    private readonly events: EventsPublisher,
  ) {}

  /**
   * Submit or resubmit the single deliverable for an accepted application.
   * D1–D4 are enforced server-side. First submission must beat the deadline;
   * a resubmission is allowed afterwards (the company invited the improvement by
   * leaving feedback) and marks the prior evaluation stale.
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
    assertHasTarget(dto.linkUrl, dto.fileUrl); // D4

    // D3: one deliverable per application.
    const existing = await this.deliverables.findOne({ where: { applicationId } });
    if (!existing) {
      // D2: the first submission must land before the deadline.
      assertBeforeSubmissionDeadline(
        application.project.submissionDeadline,
        new Date(),
      );
    }

    const deliverable = existing ?? this.deliverables.create({ applicationId });
    deliverable.linkUrl = dto.linkUrl ?? null;
    deliverable.fileUrl = dto.fileUrl ?? null;
    deliverable.filePublicId = dto.filePublicId ?? null;
    deliverable.note = dto.note;
    deliverable.submittedAt = new Date();
    if (existing) deliverable.version = existing.version + 1;
    const saved = await this.deliverables.save(deliverable);

    // A resubmission invalidates the prior verdict until the company re-evaluates.
    if (existing) {
      await this.evaluations.update(
        { deliverableId: saved.id },
        { stale: true },
      );
    }

    await this.events.deliverableSubmitted({
      graduateId: application.graduateId,
      graduateName: application.graduate.fullName,
      companyId: application.project.companyId,
      projectId: application.projectId,
      projectTitle: application.project.title,
    });
    return saved;
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
        : await this.applications.loadForTeamGraduate(user.id, applicationId);

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

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/index.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { DeliverablesService } from '../../deliverables/services/deliverables.service.js';
import { EventsPublisher } from '../../activity/services/events.publisher.js';
import { Evaluation } from '../entities/evaluation.entity.js';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto.js';
import { UpdateEvaluationDto } from '../dto/update-evaluation.dto.js';
import {
  assertNotAlreadyEvaluated,
  assertScoreInRange,
} from '../rules/evaluation.rules.js';
import type { Deliverable } from '../../deliverables/entities/deliverable.entity.js';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
    private readonly deliverables: DeliverablesService,
    private readonly companies: CompaniesService,
    private readonly events: EventsPublisher,
  ) {}

  /** E1–E3: the owning company records the first evaluation for a deliverable. */
  async create(
    userId: string,
    deliverableId: string,
    dto: CreateEvaluationDto,
  ): Promise<Evaluation> {
    const deliverable = await this.deliverables.getByIdWithChain(deliverableId);
    const company = await this.companies.getByUserIdOrThrow(userId);
    if (deliverable.application.project.companyId !== company.id) {
      throw new ForbiddenException('Only the owning company may evaluate.'); // E1
    }

    assertScoreInRange(dto.score); // E2
    const existing = await this.evaluations.findOne({ where: { deliverableId } });
    assertNotAlreadyEvaluated(Boolean(existing)); // E3: one row; edits use update()

    const evaluation = this.evaluations.create({
      deliverableId,
      score: dto.score,
      feedback: dto.feedback,
      outcome: dto.outcome, // E4: SELECTED_FOR_INTERVIEW records the invitation
      evaluatedAt: new Date(),
      evaluatedVersion: deliverable.version,
      stale: false,
    });
    let saved: Evaluation;
    try {
      saved = await this.evaluations.save(evaluation);
    } catch (err) {
      // E3 again, under a concurrent write: the unique index is the authority.
      if (err instanceof QueryFailedError) {
        throw new ConflictException(
          'This deliverable already has an evaluation; edit it instead.',
        );
      }
      throw err;
    }
    await this.publishRecorded(deliverable, saved);
    return saved;
  }

  /** The owning company revises an existing evaluation (and clears staleness). */
  async update(
    userId: string,
    deliverableId: string,
    dto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    const deliverable = await this.deliverables.getByIdWithChain(deliverableId);
    const company = await this.companies.getByUserIdOrThrow(userId);
    if (deliverable.application.project.companyId !== company.id) {
      throw new ForbiddenException('Only the owning company may evaluate.'); // E1
    }

    const evaluation = await this.evaluations.findOne({ where: { deliverableId } });
    if (!evaluation) {
      throw new NotFoundException('This deliverable has not been evaluated yet.');
    }

    if (dto.score !== undefined) {
      assertScoreInRange(dto.score); // E2
      evaluation.score = dto.score;
    }
    if (dto.feedback !== undefined) evaluation.feedback = dto.feedback;
    if (dto.outcome !== undefined) evaluation.outcome = dto.outcome;
    evaluation.evaluatedAt = new Date();
    evaluation.evaluatedVersion = deliverable.version;
    evaluation.stale = false;

    const saved = await this.evaluations.save(evaluation);
    await this.publishRecorded(deliverable, saved);
    return saved;
  }

  private async publishRecorded(deliverable: Deliverable, evaluation: Evaluation) {
    await this.events.evaluationRecorded({
      graduateId: deliverable.application.graduateId,
      companyId: deliverable.application.project.companyId,
      projectId: deliverable.application.projectId,
      projectTitle: deliverable.application.project.title,
      score: evaluation.score,
      outcome: evaluation.outcome,
    });
  }

  /** Role-aware read: the concerned graduate or the owning company (V3). */
  async getForDeliverable(
    user: { id: string; role: string },
    deliverableId: string,
  ): Promise<Evaluation> {
    const deliverable: Deliverable =
      await this.deliverables.getByIdWithChain(deliverableId);

    if (user.role === UserRole.COMPANY) {
      const company = await this.companies.getByUserIdOrThrow(user.id);
      if (deliverable.application.project.companyId !== company.id) {
        throw new ForbiddenException('You do not own this deliverable.');
      }
    } else if (deliverable.application.graduate.userId !== user.id) {
      throw new ForbiddenException('You do not own this deliverable.');
    }

    const evaluation = await this.evaluations.findOne({ where: { deliverableId } });
    if (!evaluation) {
      throw new NotFoundException('This deliverable has not been evaluated yet.');
    }
    return evaluation;
  }

  async findByDeliverableId(deliverableId: string): Promise<Evaluation | null> {
    return this.evaluations.findOne({ where: { deliverableId } });
  }
}

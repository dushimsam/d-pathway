import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ActivityType } from '../../../common/enums/index.js';
import { EVENTS_QUEUE } from '../../../redis/redis.constants.js';
import { MailService } from '../../mail/mail.service.js';
import { emailTemplates } from '../../mail/mail.templates.js';
import { ActivityService } from './activity.service.js';
import type {
  ApplicationDecidedEvent,
  DeliverableSubmittedEvent,
  EvaluationRecordedEvent,
  PrizeAwardedEvent,
} from './events.publisher.js';

/**
 * BullMQ worker for the events queue. Each domain event is turned into an
 * Activity row (for the in-app feed) and, where relevant, a transactional
 * email. Failures are retried per the producer's job options; the queue is the
 * durability boundary.
 */
@Processor(EVENTS_QUEUE)
export class ActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(
    private readonly activity: ActivityService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'deliverable.submitted':
        return this.onDeliverableSubmitted(job.data as DeliverableSubmittedEvent);
      case 'evaluation.recorded':
        return this.onEvaluationRecorded(job.data as EvaluationRecordedEvent);
      case 'application.decided':
        return this.onApplicationDecided(job.data as ApplicationDecidedEvent);
      case 'prize.awarded':
        return this.onPrizeAwarded(job.data as PrizeAwardedEvent);
      default:
        this.logger.warn(`Unhandled event: ${job.name}`);
    }
  }

  private async onDeliverableSubmitted(e: DeliverableSubmittedEvent) {
    await this.activity.record({
      type: ActivityType.DELIVERABLE_SUBMITTED,
      message: `${e.graduateName} submitted a deliverable for “${e.projectTitle}”.`,
      companyId: e.companyId,
      graduateId: e.graduateId,
      projectId: e.projectId,
      meta: { projectTitle: e.projectTitle },
    });
    const t = emailTemplates.deliverableSubmitted(e.projectTitle, e.graduateName);
    await this.mail.notifyCompany(e.companyId, t.subject, t.html);
  }

  private async onEvaluationRecorded(e: EvaluationRecordedEvent) {
    await this.activity.record({
      type: ActivityType.EVALUATION_RECORDED,
      message: `Your submission for “${e.projectTitle}” was evaluated: ${e.outcome} (score ${e.score}).`,
      companyId: e.companyId,
      graduateId: e.graduateId,
      projectId: e.projectId,
      meta: { projectTitle: e.projectTitle, score: e.score, outcome: e.outcome },
    });
    const t = emailTemplates.evaluationRecorded(
      e.projectTitle,
      e.score,
      e.outcome,
    );
    await this.mail.notifyGraduate(e.graduateId, t.subject, t.html);
  }

  private async onApplicationDecided(e: ApplicationDecidedEvent) {
    await this.activity.record({
      type: e.accepted
        ? ActivityType.APPLICATION_ACCEPTED
        : ActivityType.APPLICATION_DECLINED,
      message: e.accepted
        ? `${e.companyName} accepted your application for “${e.projectTitle}”.`
        : `${e.companyName} declined your application for “${e.projectTitle}”.`,
      companyId: e.companyId,
      graduateId: e.graduateId,
      projectId: e.projectId,
      meta: { projectTitle: e.projectTitle },
    });
    const t = e.accepted
      ? emailTemplates.applicationAccepted(e.projectTitle, e.companyName)
      : emailTemplates.applicationDeclined(
          e.projectTitle,
          e.companyName,
          e.declineReason,
        );
    await this.mail.notifyGraduate(e.graduateId, t.subject, t.html);
  }

  private async onPrizeAwarded(e: PrizeAwardedEvent) {
    await this.activity.record({
      type: ActivityType.PRIZE_AWARDED,
      message: `🏆 You won the ${e.currency.toUpperCase()} ${e.amount.toLocaleString(
        'en-US',
      )} prize for “${e.projectTitle}” from ${e.companyName}.`,
      companyId: null,
      graduateId: e.graduateId,
      projectId: e.projectId,
      meta: { projectTitle: e.projectTitle, amount: e.amount },
    });
    const t = emailTemplates.prizeAwarded(
      e.projectTitle,
      e.companyName,
      e.amount,
      e.currency,
    );
    await this.mail.notifyGraduate(e.graduateId, t.subject, t.html);
  }
}

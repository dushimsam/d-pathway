import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ActivityType } from '../../../common/enums/index.js';
import { EVENTS_QUEUE } from '../../../redis/redis.constants.js';
import { ActivityService } from './activity.service.js';
import type {
  DeliverableSubmittedEvent,
  EvaluationRecordedEvent,
} from './events.publisher.js';

/**
 * BullMQ worker for the events queue. Each domain event is turned into an
 * Activity row for both the company and the graduate feed. Failures are retried
 * per the producer's job options; the queue is the durability boundary.
 */
@Processor(EVENTS_QUEUE)
export class ActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(private readonly activity: ActivityService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'deliverable.submitted':
        return this.onDeliverableSubmitted(job.data as DeliverableSubmittedEvent);
      case 'evaluation.recorded':
        return this.onEvaluationRecorded(job.data as EvaluationRecordedEvent);
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
  }
}

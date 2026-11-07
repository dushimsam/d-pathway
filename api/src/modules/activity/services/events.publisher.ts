import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EVENTS_QUEUE } from '../../../redis/redis.constants.js';

export interface DeliverableSubmittedEvent {
  graduateId: string;
  graduateName: string;
  companyId: string;
  projectId: string;
  projectTitle: string;
}

export interface EvaluationRecordedEvent {
  graduateId: string;
  companyId: string;
  projectId: string;
  projectTitle: string;
  score: number;
  outcome: string;
}

export interface ApplicationDecidedEvent {
  graduateId: string;
  companyId: string;
  companyName: string;
  projectId: string;
  projectTitle: string;
  accepted: boolean;
  declineReason?: string | null;
}

export interface PrizeAwardedEvent {
  graduateId: string;
  companyName: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  currency: string;
}

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};

/**
 * Publishes domain events to the BullMQ queue. Producers never write the
 * activity row directly — the worker does, asynchronously, with retries.
 */
@Injectable()
export class EventsPublisher {
  constructor(@InjectQueue(EVENTS_QUEUE) private readonly queue: Queue) {}

  deliverableSubmitted(payload: DeliverableSubmittedEvent) {
    return this.queue.add('deliverable.submitted', payload, JOB_OPTS);
  }

  evaluationRecorded(payload: EvaluationRecordedEvent) {
    return this.queue.add('evaluation.recorded', payload, JOB_OPTS);
  }

  applicationDecided(payload: ApplicationDecidedEvent) {
    return this.queue.add('application.decided', payload, JOB_OPTS);
  }

  prizeAwarded(payload: PrizeAwardedEvent) {
    return this.queue.add('prize.awarded', payload, JOB_OPTS);
  }
}

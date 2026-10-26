import { ConflictException } from '@nestjs/common';
import { ApplicationStatus, ProjectStatus } from '../../../common/enums/index.js';

/**
 * Pure rule functions for the application lifecycle. Each throws a 409 carrying
 * the business rule's own sentence. Tested in application.rules.spec.ts.
 */

/** A1: a graduate may apply only to a project whose status is OPEN. */
export function assertProjectOpen(status: ProjectStatus): void {
  if (status !== ProjectStatus.OPEN) {
    throw new ConflictException(
      'A graduate may apply only to a project whose status is OPEN.',
    );
  }
}

/** A2: the graduate must accept the IP terms before applying. */
export function assertTermsAccepted(termsAccepted: boolean): void {
  if (termsAccepted !== true) {
    throw new ConflictException(
      'The graduate must accept the IP terms before applying.',
    );
  }
}

/** A3: no application is created or accepted after the application deadline. */
export function assertBeforeApplicationDeadline(
  applicationDeadline: Date,
  now: Date,
): void {
  if (now.getTime() > applicationDeadline.getTime()) {
    throw new ConflictException(
      'No application is accepted after the application deadline.',
    );
  }
}

/** A5: only a PENDING application may be accepted or declined. */
export function assertPending(status: ApplicationStatus): void {
  if (status !== ApplicationStatus.PENDING) {
    throw new ConflictException(
      'Only a PENDING application may be accepted or declined.',
    );
  }
}

/** A6: declining requires a non-empty reason. */
export function assertDeclineReason(reason: string | undefined | null): void {
  if (!reason || reason.trim().length === 0) {
    throw new ConflictException('Declining requires a non-empty reason.');
  }
}

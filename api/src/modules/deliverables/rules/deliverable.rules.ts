import { ConflictException } from '@nestjs/common';
import { ApplicationStatus } from '../../../common/enums/index.js';

/**
 * Pure rule functions for the deliverable. Each throws a 409 carrying the
 * business rule's own sentence. Tested in deliverable.rules.spec.ts.
 */

/** D1: a deliverable may be submitted only for an ACCEPTED application. */
export function assertApplicationAccepted(status: ApplicationStatus): void {
  if (status !== ApplicationStatus.ACCEPTED) {
    throw new ConflictException(
      'A deliverable may be submitted only for an ACCEPTED application.',
    );
  }
}

/** D2: a deliverable may be submitted only on or before the submission deadline. */
export function assertBeforeSubmissionDeadline(
  submissionDeadline: Date,
  now: Date,
): void {
  if (now.getTime() > submissionDeadline.getTime()) {
    throw new ConflictException(
      'A deliverable may be submitted only on or before the submission deadline.',
    );
  }
}

/** D4: a deliverable must carry at least a linkUrl or a fileUrl. */
export function assertHasTarget(
  linkUrl: string | null | undefined,
  fileUrl: string | null | undefined,
): void {
  if (!linkUrl && !fileUrl) {
    throw new ConflictException(
      'A deliverable must carry at least a linkUrl or a fileUrl.',
    );
  }
}

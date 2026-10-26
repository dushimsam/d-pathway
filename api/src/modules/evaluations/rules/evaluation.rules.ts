import { ConflictException } from '@nestjs/common';

/**
 * Pure rule functions for the evaluation. Each throws a 409 carrying the
 * business rule's own sentence. Tested in evaluation.rules.spec.ts.
 */

/** E2: score is an integer 1 to 5. */
export function assertScoreInRange(score: number): void {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new ConflictException('Score is an integer 1 to 5.');
  }
}

/** E3: exactly one evaluation per deliverable, and it is immutable. */
export function assertNotAlreadyEvaluated(exists: boolean): void {
  if (exists) {
    throw new ConflictException(
      'Exactly one evaluation per deliverable; it is immutable and cannot be rewritten.',
    );
  }
}

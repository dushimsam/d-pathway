import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApplicationStatus } from '../../../common/enums/index.js';
import {
  assertApplicationAccepted,
  assertBeforeSubmissionDeadline,
  assertHasTarget,
} from './deliverable.rules.js';

describe('deliverable rules', () => {
  it('D1: a deliverable needs an ACCEPTED application', () => {
    expect(() => assertApplicationAccepted(ApplicationStatus.ACCEPTED)).not.toThrow();
    expect(() => assertApplicationAccepted(ApplicationStatus.PENDING)).toThrow(
      ConflictException,
    );
  });

  it('D2: a deliverable may be submitted only before the submission deadline', () => {
    const deadline = new Date(Date.now() + 1000);
    expect(() => assertBeforeSubmissionDeadline(deadline, new Date())).not.toThrow();
    const past = new Date(Date.now() - 1000);
    expect(() => assertBeforeSubmissionDeadline(past, new Date())).toThrow(
      'submission deadline',
    );
  });

  it('D4: a deliverable must carry at least a linkUrl or a fileUrl', () => {
    expect(() => assertHasTarget('https://x', null)).not.toThrow();
    expect(() => assertHasTarget(null, 'https://f')).not.toThrow();
    expect(() => assertHasTarget(null, null)).toThrow('at least a linkUrl');
  });
});

import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApplicationStatus, ProjectStatus } from '../../../common/enums/index.js';
import {
  assertBeforeApplicationDeadline,
  assertDeclineReason,
  assertPending,
  assertProjectOpen,
  assertTermsAccepted,
} from './application.rules.js';

describe('application rules', () => {
  it('A1: a graduate may apply only to an OPEN project', () => {
    expect(() => assertProjectOpen(ProjectStatus.OPEN)).not.toThrow();
    expect(() => assertProjectOpen(ProjectStatus.DRAFT)).toThrow(ConflictException);
    expect(() => assertProjectOpen(ProjectStatus.IN_PROGRESS)).toThrow();
  });

  it('A2: the graduate must accept the IP terms', () => {
    expect(() => assertTermsAccepted(true)).not.toThrow();
    expect(() => assertTermsAccepted(false)).toThrow('accept the IP terms');
  });

  it('A3: no application after the application deadline', () => {
    const deadline = new Date(Date.now() + 1000);
    expect(() => assertBeforeApplicationDeadline(deadline, new Date())).not.toThrow();
    const past = new Date(Date.now() - 1000);
    expect(() => assertBeforeApplicationDeadline(past, new Date())).toThrow(
      'after the application deadline',
    );
  });

  it('A5: only a PENDING application may be accepted or declined', () => {
    expect(() => assertPending(ApplicationStatus.PENDING)).not.toThrow();
    expect(() => assertPending(ApplicationStatus.ACCEPTED)).toThrow(
      ConflictException,
    );
  });

  it('A6: declining requires a non-empty reason', () => {
    expect(() => assertDeclineReason('too junior')).not.toThrow();
    expect(() => assertDeclineReason('   ')).toThrow('non-empty reason');
    expect(() => assertDeclineReason(null)).toThrow('non-empty reason');
  });
});

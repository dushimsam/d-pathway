import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ProjectStatus } from '../../../common/enums/index.js';
import {
  assertClosable,
  assertEditable,
  assertPublishable,
  assertPublishableState,
  hasApplicationDeadlinePassed,
} from './project.rules.js';

const future = (ms: number) => new Date(Date.now() + ms);

describe('project rules', () => {
  describe('P2/P-LOCK assertEditable', () => {
    it('allows editing a DRAFT', () => {
      expect(() => assertEditable({ status: ProjectStatus.DRAFT })).not.toThrow();
    });
    it('rejects editing once OPEN', () => {
      expect(() => assertEditable({ status: ProjectStatus.OPEN })).toThrow(
        ConflictException,
      );
    });
  });

  describe('P3 assertPublishable', () => {
    const base = {
      brief: 'a real brief',
      requiredSkills: ['typescript'],
      applicationDeadline: future(1000 * 60 * 60),
      submissionDeadline: future(1000 * 60 * 60 * 48),
    };
    it('passes a complete, well-ordered project', () => {
      expect(() => assertPublishable(base, new Date())).not.toThrow();
    });
    it('rejects an empty brief', () => {
      expect(() =>
        assertPublishable({ ...base, brief: '  ' }, new Date()),
      ).toThrow('non-empty brief');
    });
    it('rejects no required skills', () => {
      expect(() =>
        assertPublishable({ ...base, requiredSkills: [] }, new Date()),
      ).toThrow('at least one required skill');
    });
    it('rejects an application deadline in the past', () => {
      expect(() =>
        assertPublishable(
          { ...base, applicationDeadline: new Date(Date.now() - 1000) },
          new Date(),
        ),
      ).toThrow('future');
    });
    it('rejects a submission deadline not after the application deadline', () => {
      const d = future(1000 * 60 * 60);
      expect(() =>
        assertPublishable(
          { ...base, applicationDeadline: d, submissionDeadline: d },
          new Date(),
        ),
      ).toThrow('strictly after');
    });
  });

  describe('assertPublishableState', () => {
    it('only a DRAFT may be published', () => {
      expect(() =>
        assertPublishableState({ status: ProjectStatus.OPEN }),
      ).toThrow(ConflictException);
    });
  });

  describe('P4 assertClosable', () => {
    it('only IN_PROGRESS may be closed', () => {
      expect(() => assertClosable({ status: ProjectStatus.OPEN })).toThrow(
        ConflictException,
      );
      expect(() =>
        assertClosable({ status: ProjectStatus.IN_PROGRESS }),
      ).not.toThrow();
    });
  });

  describe('P4 hasApplicationDeadlinePassed', () => {
    it('is true only after the deadline', () => {
      const past = { applicationDeadline: new Date(Date.now() - 1000) };
      const ahead = { applicationDeadline: future(1000) };
      expect(hasApplicationDeadlinePassed(past, new Date())).toBe(true);
      expect(hasApplicationDeadlinePassed(ahead, new Date())).toBe(false);
    });
  });
});

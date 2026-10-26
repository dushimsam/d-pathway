import { ConflictException } from '@nestjs/common';
import { ProjectStatus } from '../../../common/enums/index.js';
import type { Project } from '../entities/project.entity.js';

/**
 * Pure rule functions for the project lifecycle. Each throws a 409 carrying the
 * business rule's own sentence. Tested in isolation in project.rules.spec.ts.
 */

/** P2 / P-LOCK: a project is editable only while DRAFT. */
export function assertEditable(project: Pick<Project, 'status'>): void {
  if (project.status !== ProjectStatus.DRAFT) {
    throw new ConflictException(
      'A project is editable only while DRAFT; once published its brief, deadlines, required skills and IP terms are frozen.',
    );
  }
}

export interface PublishableFields {
  brief: string;
  requiredSkills: string[];
  applicationDeadline: Date;
  submissionDeadline: Date;
}

/**
 * P3: publishing (DRAFT → OPEN) requires a non-empty brief, at least one
 * required skill, an application deadline in the future, and a submission
 * deadline strictly after the application deadline.
 */
export function assertPublishable(
  project: PublishableFields,
  now: Date,
): void {
  if (!project.brief || project.brief.trim().length === 0) {
    throw new ConflictException('Publishing requires a non-empty brief.');
  }
  if (!project.requiredSkills || project.requiredSkills.length === 0) {
    throw new ConflictException('Publishing requires at least one required skill.');
  }
  if (project.applicationDeadline.getTime() <= now.getTime()) {
    throw new ConflictException(
      'Publishing requires an application deadline in the future.',
    );
  }
  if (
    project.submissionDeadline.getTime() <= project.applicationDeadline.getTime()
  ) {
    throw new ConflictException(
      'The submission deadline must be strictly after the application deadline.',
    );
  }
}

/** P3 start state: only a DRAFT may be published. */
export function assertPublishableState(project: Pick<Project, 'status'>): void {
  if (project.status !== ProjectStatus.DRAFT) {
    throw new ConflictException('Only a DRAFT project can be published.');
  }
}

/** P4: only an IN_PROGRESS project can be closed. */
export function assertClosable(project: Pick<Project, 'status'>): void {
  if (project.status !== ProjectStatus.IN_PROGRESS) {
    throw new ConflictException('Only an IN_PROGRESS project can be closed.');
  }
}

/** P4: OPEN → IN_PROGRESS once the application deadline has passed. */
export function hasApplicationDeadlinePassed(
  project: Pick<Project, 'applicationDeadline'>,
  now: Date,
): boolean {
  return now.getTime() > project.applicationDeadline.getTime();
}

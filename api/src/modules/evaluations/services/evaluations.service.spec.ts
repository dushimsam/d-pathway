import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EvaluationOutcome } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { EvaluationsService } from './evaluations.service.js';

function make() {
  const evaluations = mockRepo();
  const deliverables = { getByIdWithChain: vi.fn() };
  const companies = { getByUserIdOrThrow: vi.fn() };
  const events = { evaluationRecorded: vi.fn() };
  const service = new EvaluationsService(
    evaluations as never,
    deliverables as never,
    companies as never,
    events as never,
  );
  return { service, evaluations, deliverables, companies, events };
}

const COMPANY = { id: 'co-1' };

function deliverable() {
  return {
    id: 'del-1',
    version: 3,
    application: {
      graduateId: 'grad-1',
      projectId: 'proj-1',
      project: { companyId: 'co-1', title: 'Project X' },
      graduate: { userId: 'grad-user' },
    },
  };
}

const CREATE_DTO = {
  score: 4,
  feedback: 'Great work',
  outcome: EvaluationOutcome.SELECTED_FOR_INTERVIEW,
};

describe('EvaluationsService.create', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.deliverables.getByIdWithChain.mockResolvedValue(deliverable());
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.evaluations.findOne.mockResolvedValue(null);
  });

  it('records the first evaluation for the owning company', async () => {
    const result = await ctx.service.create('co-user', 'del-1', CREATE_DTO);
    expect(ctx.evaluations.save).toHaveBeenCalled();
    expect(result.score).toBe(4);
    expect(result.deliverableId).toBe('del-1');
    expect(result.evaluatedVersion).toBe(3);
    expect(result.stale).toBe(false);
    expect(ctx.events.evaluationRecorded).toHaveBeenCalledWith(
      expect.objectContaining({
        graduateId: 'grad-1',
        companyId: 'co-1',
        projectId: 'proj-1',
        projectTitle: 'Project X',
        score: 4,
        outcome: EvaluationOutcome.SELECTED_FOR_INTERVIEW,
      }),
    );
  });

  it('forbids a company that does not own the deliverable', async () => {
    ctx.companies.getByUserIdOrThrow.mockResolvedValue({ id: 'other-co' });
    await expect(
      ctx.service.create('co-user', 'del-1', CREATE_DTO),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an out-of-range score', async () => {
    await expect(
      ctx.service.create('co-user', 'del-1', { ...CREATE_DTO, score: 9 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a second evaluation (already evaluated)', async () => {
    ctx.evaluations.findOne.mockResolvedValue({ id: 'ev-existing' });
    await expect(
      ctx.service.create('co-user', 'del-1', CREATE_DTO),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a concurrent unique-index violation to a Conflict', async () => {
    ctx.evaluations.save.mockRejectedValue(
      new QueryFailedError('insert', [], new Error('duplicate key')),
    );
    await expect(
      ctx.service.create('co-user', 'del-1', CREATE_DTO),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows a non-QueryFailedError from save', async () => {
    const boom = new Error('db down');
    ctx.evaluations.save.mockRejectedValue(boom);
    await expect(
      ctx.service.create('co-user', 'del-1', CREATE_DTO),
    ).rejects.toBe(boom);
  });
});

describe('EvaluationsService.update', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.deliverables.getByIdWithChain.mockResolvedValue(deliverable());
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.evaluations.findOne.mockResolvedValue({
      id: 'ev-1',
      deliverableId: 'del-1',
      score: 2,
      feedback: 'old',
      outcome: EvaluationOutcome.NOT_SELECTED,
      stale: true,
    });
  });

  it('revises all fields and clears staleness', async () => {
    const result = await ctx.service.update('co-user', 'del-1', {
      score: 5,
      feedback: 'improved',
      outcome: EvaluationOutcome.SELECTED_FOR_INTERVIEW,
    });
    expect(result.score).toBe(5);
    expect(result.feedback).toBe('improved');
    expect(result.outcome).toBe(EvaluationOutcome.SELECTED_FOR_INTERVIEW);
    expect(result.stale).toBe(false);
    expect(result.evaluatedVersion).toBe(3);
    expect(ctx.events.evaluationRecorded).toHaveBeenCalled();
  });

  it('leaves untouched fields when the dto omits them', async () => {
    const result = await ctx.service.update('co-user', 'del-1', {});
    expect(result.score).toBe(2);
    expect(result.feedback).toBe('old');
    expect(result.outcome).toBe(EvaluationOutcome.NOT_SELECTED);
    expect(result.stale).toBe(false);
  });

  it('forbids a non-owning company', async () => {
    ctx.companies.getByUserIdOrThrow.mockResolvedValue({ id: 'other-co' });
    await expect(
      ctx.service.update('co-user', 'del-1', { score: 3 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404s when the deliverable has no evaluation yet', async () => {
    ctx.evaluations.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.update('co-user', 'del-1', { score: 3 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an out-of-range score on update', async () => {
    await expect(
      ctx.service.update('co-user', 'del-1', { score: 0 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('EvaluationsService.getForDeliverable', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.deliverables.getByIdWithChain.mockResolvedValue(deliverable());
    ctx.companies.getByUserIdOrThrow.mockResolvedValue(COMPANY);
    ctx.evaluations.findOne.mockResolvedValue({ id: 'ev-1' });
  });

  it('returns the evaluation for the owning company', async () => {
    const result = await ctx.service.getForDeliverable(
      { id: 'co-user', role: 'COMPANY' },
      'del-1',
    );
    expect(result.id).toBe('ev-1');
  });

  it('forbids a company that does not own the deliverable', async () => {
    ctx.companies.getByUserIdOrThrow.mockResolvedValue({ id: 'other-co' });
    await expect(
      ctx.service.getForDeliverable({ id: 'co-user', role: 'COMPANY' }, 'del-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the evaluation for the concerned graduate', async () => {
    const result = await ctx.service.getForDeliverable(
      { id: 'grad-user', role: 'GRADUATE' },
      'del-1',
    );
    expect(result.id).toBe('ev-1');
  });

  it('forbids an unrelated graduate', async () => {
    await expect(
      ctx.service.getForDeliverable({ id: 'stranger', role: 'GRADUATE' }, 'del-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404s when there is no evaluation', async () => {
    ctx.evaluations.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getForDeliverable({ id: 'grad-user', role: 'GRADUATE' }, 'del-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('EvaluationsService.findByDeliverableId', () => {
  it('delegates to the repository', async () => {
    const ctx = make();
    ctx.evaluations.findOne.mockResolvedValue({ id: 'ev-1' });
    const result = await ctx.service.findByDeliverableId('del-1');
    expect(result).toEqual({ id: 'ev-1' });
    expect(ctx.evaluations.findOne).toHaveBeenCalledWith({
      where: { deliverableId: 'del-1' },
    });
  });
});

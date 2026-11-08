import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { DeliverablesService } from './deliverables.service.js';

function make() {
  const deliverables = mockRepo();
  const evaluations = mockRepo();
  const applications = {
    loadForOwningGraduate: vi.fn(),
    loadForOwningCompany: vi.fn(),
    loadForTeamGraduate: vi.fn(),
  };
  const events = { deliverableSubmitted: vi.fn() };
  const service = new DeliverablesService(
    deliverables as never,
    evaluations as never,
    applications as never,
    events as never,
  );
  return { service, deliverables, evaluations, applications, events };
}

function application(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    status: ApplicationStatus.ACCEPTED,
    graduateId: 'grad-1',
    graduate: { fullName: 'Grace Grad' },
    projectId: 'proj-1',
    project: {
      companyId: 'co-1',
      title: 'Project X',
      submissionDeadline: new Date(Date.now() + 60_000),
    },
    ...overrides,
  };
}

const DTO = {
  linkUrl: 'https://repo/x',
  fileUrl: undefined,
  filePublicId: undefined,
  note: 'Please review',
};

describe('DeliverablesService.submit', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.applications.loadForOwningGraduate.mockResolvedValue(application());
    ctx.deliverables.findOne.mockResolvedValue(null);
  });

  it('creates a first deliverable before the deadline', async () => {
    const result = await ctx.service.submit('grad-user', 'app-1', DTO);
    expect(ctx.deliverables.create).toHaveBeenCalled();
    expect(result.linkUrl).toBe('https://repo/x');
    expect(result.fileUrl).toBeNull();
    expect(result.filePublicId).toBeNull();
    expect(result.note).toBe('Please review');
    expect(result.submittedAt).toBeInstanceOf(Date);
    expect(ctx.evaluations.update).not.toHaveBeenCalled();
    expect(ctx.events.deliverableSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        graduateId: 'grad-1',
        graduateName: 'Grace Grad',
        companyId: 'co-1',
        projectId: 'proj-1',
        projectTitle: 'Project X',
      }),
    );
  });

  it('carries file fields through when provided', async () => {
    const result = await ctx.service.submit('grad-user', 'app-1', {
      linkUrl: undefined,
      fileUrl: 'https://cdn/file',
      filePublicId: 'pub-1',
      note: 'file only',
    });
    expect(result.linkUrl).toBeNull();
    expect(result.fileUrl).toBe('https://cdn/file');
    expect(result.filePublicId).toBe('pub-1');
  });

  it('resubmits by bumping version and marking the prior evaluation stale', async () => {
    const existing = {
      id: 'del-1',
      version: 1,
      linkUrl: 'old',
      fileUrl: null,
      filePublicId: null,
    };
    ctx.deliverables.findOne.mockResolvedValue(existing);

    const result = await ctx.service.submit('grad-user', 'app-1', DTO);
    expect(ctx.deliverables.create).not.toHaveBeenCalled();
    expect(result.version).toBe(2);
    expect(ctx.evaluations.update).toHaveBeenCalledWith(
      { deliverableId: 'del-1' },
      { stale: true },
    );
  });

  it('rejects when the application is not accepted', async () => {
    ctx.applications.loadForOwningGraduate.mockResolvedValue(
      application({ status: ApplicationStatus.PENDING }),
    );
    await expect(
      ctx.service.submit('grad-user', 'app-1', DTO),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when neither a link nor a file is supplied', async () => {
    await expect(
      ctx.service.submit('grad-user', 'app-1', {
        linkUrl: undefined,
        fileUrl: undefined,
        filePublicId: undefined,
        note: 'nothing',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a first submission past the deadline', async () => {
    ctx.applications.loadForOwningGraduate.mockResolvedValue(
      application({
        project: {
          companyId: 'co-1',
          title: 'Project X',
          submissionDeadline: new Date(Date.now() - 60_000),
        },
      }),
    );
    await expect(
      ctx.service.submit('grad-user', 'app-1', DTO),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('DeliverablesService.getForApplication', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns the deliverable for the owning company', async () => {
    ctx.applications.loadForOwningCompany.mockResolvedValue({
      application: { id: 'app-1' },
    });
    ctx.deliverables.findOne.mockResolvedValue({ id: 'del-1' });
    const result = await ctx.service.getForApplication(
      { id: 'co-user', role: 'COMPANY' },
      'app-1',
    );
    expect(result.id).toBe('del-1');
    expect(ctx.deliverables.findOne).toHaveBeenCalledWith({
      where: { applicationId: 'app-1' },
    });
  });

  it('returns the deliverable for a team graduate', async () => {
    ctx.applications.loadForTeamGraduate.mockResolvedValue({ id: 'app-1' });
    ctx.deliverables.findOne.mockResolvedValue({ id: 'del-1' });
    const result = await ctx.service.getForApplication(
      { id: 'grad-user', role: 'GRADUATE' },
      'app-1',
    );
    expect(result.id).toBe('del-1');
  });

  it('404s when no deliverable was submitted', async () => {
    ctx.applications.loadForTeamGraduate.mockResolvedValue({ id: 'app-1' });
    ctx.deliverables.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getForApplication({ id: 'grad-user', role: 'GRADUATE' }, 'app-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DeliverablesService.findByApplicationId', () => {
  it('delegates to the repository', async () => {
    const ctx = make();
    ctx.deliverables.findOne.mockResolvedValue({ id: 'del-1' });
    const result = await ctx.service.findByApplicationId('app-1');
    expect(result).toEqual({ id: 'del-1' });
    expect(ctx.deliverables.findOne).toHaveBeenCalledWith({
      where: { applicationId: 'app-1' },
    });
  });
});

function chainDeliverable() {
  return {
    id: 'del-1',
    application: {
      project: { company: { userId: 'co-user' } },
      graduate: { userId: 'grad-user' },
    },
  };
}

describe('DeliverablesService.getByIdForUser', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.deliverables.findOne.mockResolvedValue(chainDeliverable());
  });

  it('returns the deliverable for the owning company', async () => {
    const result = await ctx.service.getByIdForUser(
      { id: 'co-user', role: 'COMPANY' },
      'del-1',
    );
    expect(result.id).toBe('del-1');
  });

  it('404s for a company that does not own the deliverable', async () => {
    await expect(
      ctx.service.getByIdForUser({ id: 'other-co', role: 'COMPANY' }, 'del-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the deliverable for the owning graduate', async () => {
    const result = await ctx.service.getByIdForUser(
      { id: 'grad-user', role: 'GRADUATE' },
      'del-1',
    );
    expect(result.id).toBe('del-1');
  });

  it('404s for an unrelated graduate', async () => {
    await expect(
      ctx.service.getByIdForUser({ id: 'stranger', role: 'GRADUATE' }, 'del-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DeliverablesService.getByIdWithChain', () => {
  it('returns the deliverable with its chain', async () => {
    const ctx = make();
    ctx.deliverables.findOne.mockResolvedValue(chainDeliverable());
    const result = await ctx.service.getByIdWithChain('del-1');
    expect(result.id).toBe('del-1');
    expect(ctx.deliverables.findOne).toHaveBeenCalledWith({
      where: { id: 'del-1' },
      relations: { application: { project: { company: true }, graduate: true } },
    });
  });

  it('404s when the deliverable is missing', async () => {
    const ctx = make();
    ctx.deliverables.findOne.mockResolvedValue(null);
    await expect(ctx.service.getByIdWithChain('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

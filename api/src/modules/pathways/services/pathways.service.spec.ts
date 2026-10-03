import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathwayStatus } from '../../../common/enums/pathway-status.enum.js';
import { Pathway } from '../entities/pathway.entity.js';
import { PathwaysService } from './pathways.service.js';

type MockRepository = {
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  softRemove: ReturnType<typeof vi.fn>;
};

function buildPathway(overrides: Partial<Pathway> = {}): Pathway {
  const pathway = new Pathway();
  Object.assign(pathway, {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Junior DevOps Engineer Pathway',
    companyName: 'Irembo Ltd',
    description: 'Learn to ship infrastructure.',
    eligibilityCriteria: 'BSc SE/CS, GPA 3.0+',
    intakeQuota: 12,
    deadlineMonths: 6,
    status: PathwayStatus.DRAFT,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  } satisfies Partial<Pathway>);
  Object.assign(pathway, overrides);
  return pathway;
}

describe('PathwaysService', () => {
  let service: PathwaysService;
  let repository: MockRepository;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      softRemove: vi.fn(),
    };
    service = new PathwaysService(repository as never);
  });

  it('create returns a DRAFT pathway', async () => {
    const draft = buildPathway();
    repository.create.mockReturnValue(draft);
    repository.save.mockResolvedValue(draft);

    const result = await service.create({
      title: draft.title,
      companyName: draft.companyName,
      eligibilityCriteria: draft.eligibilityCriteria,
      intakeQuota: draft.intakeQuota,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: PathwayStatus.DRAFT }),
    );
    expect(result.status).toBe(PathwayStatus.DRAFT);
  });

  it('publish sets status to PUBLISHED and publishedAt', async () => {
    const draft = buildPathway();
    repository.findOne.mockResolvedValue(draft);
    repository.save.mockImplementation(async (entity: Pathway) => entity);

    const result = await service.publish(draft.id);

    expect(result.status).toBe(PathwayStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('publish twice throws 409 ConflictException', async () => {
    const published = buildPathway({
      status: PathwayStatus.PUBLISHED,
      publishedAt: new Date('2026-02-01T00:00:00Z'),
    });
    repository.findOne.mockResolvedValue(published);

    await expect(service.publish(published.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update on a published pathway throws 409 ConflictException', async () => {
    const published = buildPathway({ status: PathwayStatus.PUBLISHED });
    repository.findOne.mockResolvedValue(published);

    await expect(
      service.update(published.id, { title: 'New title' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll filters by status=PUBLISHED', async () => {
    const published = buildPathway({ status: PathwayStatus.PUBLISHED });
    repository.find.mockResolvedValue([published]);

    const result = await service.findAll(PathwayStatus.PUBLISHED);

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: PathwayStatus.PUBLISHED } }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(PathwayStatus.PUBLISHED);
  });

  it('findOne on an unknown id throws 404 NotFoundException', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

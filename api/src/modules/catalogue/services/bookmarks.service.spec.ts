import { beforeEach, describe, expect, it, vi } from 'vitest';
import { In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { mockRepo } from '../../../test/mock-repo.js';
import { BookmarksService } from './bookmarks.service.js';

function make() {
  const saved = mockRepo();
  const projects = mockRepo();
  const graduates = { getByUserIdOrThrow: vi.fn() };
  const service = new BookmarksService(
    saved as never,
    projects as never,
    graduates as never,
  );
  return { service, saved, projects, graduates };
}

const GRAD = { id: 'grad-1', userId: 'user-1' };

describe('BookmarksService.save', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
  });

  it('creates a bookmark when none exists', async () => {
    ctx.projects.findOne.mockResolvedValue({ id: 'p1' });
    ctx.saved.findOne.mockResolvedValue(null);
    const result = await ctx.service.save('user-1', 'p1');
    expect(result).toEqual({ saved: true });
    expect(ctx.saved.create).toHaveBeenCalledWith({
      graduateId: 'grad-1',
      projectId: 'p1',
    });
    expect(ctx.saved.save).toHaveBeenCalled();
  });

  it('is idempotent when the bookmark already exists', async () => {
    ctx.projects.findOne.mockResolvedValue({ id: 'p1' });
    ctx.saved.findOne.mockResolvedValue({ id: 's1' });
    const result = await ctx.service.save('user-1', 'p1');
    expect(result).toEqual({ saved: true });
    expect(ctx.saved.save).not.toHaveBeenCalled();
    expect(ctx.saved.create).not.toHaveBeenCalled();
  });

  it('404s when the project does not exist', async () => {
    ctx.projects.findOne.mockResolvedValue(null);
    await expect(ctx.service.save('user-1', 'nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('BookmarksService.remove', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
  });

  it('deletes the bookmark', async () => {
    const result = await ctx.service.remove('user-1', 'p1');
    expect(result).toEqual({ saved: false });
    expect(ctx.saved.delete).toHaveBeenCalledWith({
      graduateId: 'grad-1',
      projectId: 'p1',
    });
  });
});

describe('BookmarksService.listIds', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
  });

  it('returns the saved project ids', async () => {
    ctx.saved.find.mockResolvedValue([
      { projectId: 'p1' },
      { projectId: 'p2' },
    ]);
    const result = await ctx.service.listIds('user-1');
    expect(result).toEqual(['p1', 'p2']);
    expect(ctx.saved.find).toHaveBeenCalledWith({
      where: { graduateId: 'grad-1' },
      select: { projectId: true },
    });
  });
});

describe('BookmarksService.list', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
    ctx.graduates.getByUserIdOrThrow.mockResolvedValue(GRAD);
  });

  it('returns an empty array when nothing is saved', async () => {
    ctx.saved.find.mockResolvedValue([]);
    const result = await ctx.service.list('user-1');
    expect(result).toEqual([]);
    expect(ctx.projects.find).not.toHaveBeenCalled();
  });

  it('returns projects in saved order, skipping missing ones', async () => {
    ctx.saved.find.mockResolvedValue([
      { projectId: 'p1' },
      { projectId: 'p2' },
      { projectId: 'p3' },
    ]);
    // Repo returns them out of order and omits p2.
    ctx.projects.find.mockResolvedValue([
      { id: 'p3' },
      { id: 'p1' },
    ]);
    const result = await ctx.service.list('user-1');
    expect(result.map((p) => p.id)).toEqual(['p1', 'p3']);
    expect(ctx.projects.find).toHaveBeenCalledWith({
      where: { id: In(['p1', 'p2', 'p3']) },
      relations: { company: true },
    });
    expect(ctx.saved.find).toHaveBeenCalledWith({
      where: { graduateId: 'grad-1' },
      order: { createdAt: 'DESC' },
    });
  });
});

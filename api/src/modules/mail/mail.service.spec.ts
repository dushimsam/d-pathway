import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRepo } from '../../test/mock-repo.js';

const { resendCtor, emailsSend } = vi.hoisted(() => {
  const emailsSend = vi.fn();
  const resendCtor = vi.fn(() => ({ emails: { send: emailsSend } }));
  return { resendCtor, emailsSend };
});

vi.mock('resend', () => ({ Resend: resendCtor }));

import { MailService } from './mail.service.js';

function make(mail: { apiKey: string; from: string } = { apiKey: 'key', from: 'from@x.com' }) {
  const config = { mail };
  const users = mockRepo();
  const graduates = mockRepo();
  const companies = mockRepo();
  const service = new MailService(
    config as never,
    users as never,
    graduates as never,
    companies as never,
  );
  return { service, config, users, graduates, companies };
}

beforeEach(() => vi.clearAllMocks());

describe('MailService.send', () => {
  it('returns early when there is no recipient', async () => {
    const ctx = make();
    await ctx.service.send('', 'subject', '<p/>');
    expect(resendCtor).not.toHaveBeenCalled();
  });

  it('logs and skips when no API key is configured', async () => {
    const ctx = make({ apiKey: '', from: 'from@x.com' });
    await ctx.service.send('to@x.com', 'subject', '<p/>');
    expect(resendCtor).not.toHaveBeenCalled();
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it('sends via Resend when configured', async () => {
    const ctx = make();
    emailsSend.mockResolvedValue({ error: null });
    await ctx.service.send('to@x.com', 'Hi', '<b/>');
    expect(resendCtor).toHaveBeenCalledWith('key');
    expect(emailsSend).toHaveBeenCalledWith({
      from: 'from@x.com',
      to: 'to@x.com',
      subject: 'Hi',
      html: '<b/>',
    });
  });

  it('caches the client across sends', async () => {
    const ctx = make();
    emailsSend.mockResolvedValue({ error: null });
    await ctx.service.send('a@x.com', 's', 'h');
    await ctx.service.send('b@x.com', 's', 'h');
    expect(resendCtor).toHaveBeenCalledTimes(1);
  });

  it('swallows a Resend error result', async () => {
    const ctx = make();
    emailsSend.mockResolvedValue({ error: { message: 'boom' } });
    await expect(ctx.service.send('to@x.com', 's', 'h')).resolves.toBeUndefined();
  });

  it('swallows a thrown error', async () => {
    const ctx = make();
    emailsSend.mockRejectedValue(new Error('network'));
    await expect(ctx.service.send('to@x.com', 's', 'h')).resolves.toBeUndefined();
  });
});

describe('MailService.notifyGraduate', () => {
  it('resolves the login email and sends', async () => {
    const ctx = make();
    emailsSend.mockResolvedValue({ error: null });
    ctx.graduates.findOne.mockResolvedValue({ id: 'g1', userId: 'u1' });
    ctx.users.findOne.mockResolvedValue({ email: 'grad@x.com' });
    await ctx.service.notifyGraduate('g1', 'S', 'H');
    expect(emailsSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'grad@x.com' }));
  });

  it('returns when the graduate does not exist', async () => {
    const ctx = make();
    ctx.graduates.findOne.mockResolvedValue(null);
    await ctx.service.notifyGraduate('g1', 'S', 'H');
    expect(emailsSend).not.toHaveBeenCalled();
  });

  it('does not send when the user has no email', async () => {
    const ctx = make();
    ctx.graduates.findOne.mockResolvedValue({ id: 'g1', userId: 'u1' });
    ctx.users.findOne.mockResolvedValue(null);
    await ctx.service.notifyGraduate('g1', 'S', 'H');
    expect(emailsSend).not.toHaveBeenCalled();
  });
});

describe('MailService.notifyCompany', () => {
  it('resolves the login email and sends', async () => {
    const ctx = make();
    emailsSend.mockResolvedValue({ error: null });
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', userId: 'u2' });
    ctx.users.findOne.mockResolvedValue({ email: 'co@x.com' });
    await ctx.service.notifyCompany('c1', 'S', 'H');
    expect(emailsSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'co@x.com' }));
  });

  it('returns when the company does not exist', async () => {
    const ctx = make();
    ctx.companies.findOne.mockResolvedValue(null);
    await ctx.service.notifyCompany('c1', 'S', 'H');
    expect(emailsSend).not.toHaveBeenCalled();
  });
});

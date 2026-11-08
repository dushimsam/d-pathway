import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  WalletOwnerType,
  WalletTxnType,
} from '../../../common/enums/index.js';
import { mockRepo } from '../../../test/mock-repo.js';
import { WalletService } from './wallet.service.js';

function makeManager() {
  return {
    findOne: vi.fn(),
    save: vi.fn(async (e: unknown) => e),
    create: vi.fn((_cls: unknown, obj: unknown) => obj),
  };
}

function make() {
  const manager = makeManager();
  const dataSource = {
    transaction: vi.fn(async (cb: (m: unknown) => unknown) => cb(manager)),
  };
  const companies = mockRepo();
  const graduates = mockRepo();
  const projects = mockRepo();
  const txns = mockRepo();
  const stripe = {
    currency: 'usd',
    createTopUpSession: vi.fn(),
    retrieveSession: vi.fn(),
    fromStripe: vi.fn((n: number) => n),
  };
  const config = { corsOrigin: 'https://app.test' };
  const service = new WalletService(
    dataSource as never,
    companies as never,
    graduates as never,
    projects as never,
    txns as never,
    stripe as never,
    config as never,
  );
  return { service, manager, dataSource, companies, graduates, projects, txns, stripe, config };
}

describe('WalletService.holdPrize', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('reserves the amount and records a HOLD', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'c1', balance: 100 });

    await ctx.service.holdPrize(ctx.manager as never, 'c1', 40, 'p1', 'Prize A');

    const saved = ctx.manager.save.mock.calls[0][0];
    expect(saved.balance).toBe(60);
    const txn = ctx.manager.create.mock.calls[0][1];
    expect(txn.type).toBe(WalletTxnType.HOLD);
    expect(txn.amount).toBe(-40);
    expect(txn.ownerType).toBe(WalletOwnerType.COMPANY);
    expect(ctx.manager.save).toHaveBeenCalledTimes(2); // company + txn
  });

  it('404s when the company is missing', async () => {
    ctx.manager.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.holdPrize(ctx.manager as never, 'c1', 40, 'p1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('conflicts when the balance is insufficient', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'c1', balance: 10 });
    await expect(
      ctx.service.holdPrize(ctx.manager as never, 'c1', 40, 'p1', 'x'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('WalletService.refundPrize', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('returns the amount and records a REFUND', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'c1', balance: 60 });

    await ctx.service.refundPrize(ctx.manager as never, 'c1', 40, 'p1', 'Prize A');

    const saved = ctx.manager.save.mock.calls[0][0];
    expect(saved.balance).toBe(100);
    const txn = ctx.manager.create.mock.calls[0][1];
    expect(txn.type).toBe(WalletTxnType.REFUND);
    expect(txn.amount).toBe(40);
  });

  it('404s when the company is missing', async () => {
    ctx.manager.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.refundPrize(ctx.manager as never, 'c1', 40, 'p1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('WalletService.releasePrize', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('credits the student and records a PAYOUT', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'g1', balance: 5 });

    await ctx.service.releasePrize(ctx.manager as never, 'g1', 40, 'p1', 'Prize A');

    const saved = ctx.manager.save.mock.calls[0][0];
    expect(saved.balance).toBe(45);
    const txn = ctx.manager.create.mock.calls[0][1];
    expect(txn.type).toBe(WalletTxnType.PAYOUT);
    expect(txn.ownerType).toBe(WalletOwnerType.GRADUATE);
    expect(txn.amount).toBe(40);
  });

  it('404s when the student is missing', async () => {
    ctx.manager.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.releasePrize(ctx.manager as never, 'g1', 40, 'p1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('WalletService.getWallet', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  function stubQueryBuilder(sum: unknown) {
    const qb = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue(sum),
    };
    ctx.projects.createQueryBuilder.mockReturnValue(qb);
    return qb;
  }

  it('returns the company wallet with reserved sum and ledger', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 200 });
    stubQueryBuilder({ sum: '75' });
    ctx.txns.find.mockResolvedValue([{ id: 't1' }]);

    const result = (await ctx.service.getWallet({ id: 'u1', role: 'COMPANY' })) as {
      role: string;
      balance: number;
      reserved: number;
      currency: string;
      transactions: unknown[];
    };

    expect(result.role).toBe('COMPANY');
    expect(result.balance).toBe(200);
    expect(result.reserved).toBe(75);
    expect(result.currency).toBe('usd');
    expect(result.transactions).toHaveLength(1);
    expect(ctx.txns.find).toHaveBeenCalledWith({
      where: { ownerType: WalletOwnerType.COMPANY, ownerId: 'c1' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  });

  it('defaults reserved to 0 when the sum row is null', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 200 });
    stubQueryBuilder(null);
    ctx.txns.find.mockResolvedValue([]);

    const result = (await ctx.service.getWallet({ id: 'u1', role: 'COMPANY' })) as {
      reserved: number;
    };
    expect(result.reserved).toBe(0);
  });

  it('404s when the company profile is missing', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getWallet({ id: 'u1', role: 'COMPANY' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the graduate wallet with ledger', async () => {
    ctx.graduates.findOne.mockResolvedValue({ id: 'g1', balance: 30 });
    ctx.txns.find.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);

    const result = (await ctx.service.getWallet({ id: 'u2', role: 'GRADUATE' })) as {
      role: string;
      balance: number;
      transactions: unknown[];
    };

    expect(result.role).toBe('GRADUATE');
    expect(result.balance).toBe(30);
    expect(result.transactions).toHaveLength(2);
  });

  it('404s when the graduate profile is missing', async () => {
    ctx.graduates.findOne.mockResolvedValue(null);
    await expect(
      ctx.service.getWallet({ id: 'u2', role: 'GRADUATE' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('WalletService.createTopUp', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('rejects a non-integer amount', async () => {
    await expect(ctx.service.createTopUp('u1', 1.5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a non-positive amount', async () => {
    await expect(ctx.service.createTopUp('u1', 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('404s when the company is missing', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await expect(ctx.service.createTopUp('u1', 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('conflicts when Stripe returns a session without a url', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1' });
    ctx.stripe.createTopUpSession.mockResolvedValue({ url: null });
    await expect(ctx.service.createTopUp('u1', 10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns the checkout url on success', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1' });
    ctx.stripe.createTopUpSession.mockResolvedValue({ url: 'https://pay' });

    const result = await ctx.service.createTopUp('u1', 10);

    expect(result).toEqual({ url: 'https://pay' });
    expect(ctx.stripe.createTopUpSession).toHaveBeenCalledWith({
      companyId: 'c1',
      amount: 10,
      successUrl:
        'https://app.test/wallet?topup=success&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://app.test/wallet?topup=cancelled',
    });
  });
});

describe('WalletService.confirmTopUp', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('404s when the company is missing', async () => {
    ctx.companies.findOne.mockResolvedValue(null);
    await expect(ctx.service.confirmTopUp('u1', 'cs_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('is idempotent when the session was already credited', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue({ id: 'existing' });

    const result = await ctx.service.confirmTopUp('u1', 'cs_1');

    expect(result).toEqual({ balance: 50, credited: false });
    expect(ctx.stripe.retrieveSession).not.toHaveBeenCalled();
  });

  it('conflicts when the payment is not completed', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue(null);
    ctx.stripe.retrieveSession.mockResolvedValue({ payment_status: 'unpaid' });

    await expect(ctx.service.confirmTopUp('u1', 'cs_1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('forbids crediting a session that belongs to another company', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue(null);
    ctx.stripe.retrieveSession.mockResolvedValue({
      payment_status: 'paid',
      metadata: { companyId: 'other' },
      amount_total: 1000,
    });

    await expect(ctx.service.confirmTopUp('u1', 'cs_1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('credits the balance inside a transaction on success', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue(null);
    ctx.stripe.retrieveSession.mockResolvedValue({
      payment_status: 'paid',
      metadata: { companyId: 'c1' },
      amount_total: 2000,
    });
    ctx.stripe.fromStripe.mockReturnValue(20);
    ctx.manager.findOne.mockResolvedValue({ id: 'c1', balance: 50 });

    const result = await ctx.service.confirmTopUp('u1', 'cs_1');

    expect(result).toEqual({ balance: 70, credited: true, amount: 20 });
    const txn = ctx.manager.create.mock.calls[0][1];
    expect(txn.type).toBe(WalletTxnType.TOPUP);
    expect(txn.amount).toBe(20);
    expect(txn.stripeSessionId).toBe('cs_1');
  });

  it('defaults amount_total to 0 when absent', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue(null);
    ctx.stripe.retrieveSession.mockResolvedValue({
      payment_status: 'paid',
      metadata: { companyId: 'c1' },
    });
    ctx.stripe.fromStripe.mockReturnValue(0);
    ctx.manager.findOne.mockResolvedValue({ id: 'c1', balance: 50 });

    await ctx.service.confirmTopUp('u1', 'cs_1');
    expect(ctx.stripe.fromStripe).toHaveBeenCalledWith(0);
  });

  it('404s inside the transaction when the company vanishes', async () => {
    ctx.companies.findOne.mockResolvedValue({ id: 'c1', balance: 50 });
    ctx.txns.findOne.mockResolvedValue(null);
    ctx.stripe.retrieveSession.mockResolvedValue({
      payment_status: 'paid',
      metadata: { companyId: 'c1' },
      amount_total: 2000,
    });
    ctx.stripe.fromStripe.mockReturnValue(20);
    ctx.manager.findOne.mockResolvedValue(null);

    await expect(ctx.service.confirmTopUp('u1', 'cs_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('WalletService.withdraw', () => {
  let ctx: ReturnType<typeof make>;
  beforeEach(() => {
    ctx = make();
  });

  it('rejects a non-integer amount', async () => {
    await expect(ctx.service.withdraw('u1', 2.5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a non-positive amount', async () => {
    await expect(ctx.service.withdraw('u1', -5)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('404s when the student is missing', async () => {
    ctx.manager.findOne.mockResolvedValue(null);
    await expect(ctx.service.withdraw('u1', 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('conflicts when cashing out more than the balance', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'g1', balance: 5 });
    await expect(ctx.service.withdraw('u1', 10)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('debits the balance and records a WITHDRAWAL', async () => {
    ctx.manager.findOne.mockResolvedValue({ id: 'g1', balance: 50 });

    const result = await ctx.service.withdraw('u1', 20);

    expect(result).toEqual({ balance: 30 });
    const txn = ctx.manager.create.mock.calls[0][1];
    expect(txn.type).toBe(WalletTxnType.WITHDRAWAL);
    expect(txn.amount).toBe(-20);
    expect(txn.ownerType).toBe(WalletOwnerType.GRADUATE);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';

const { stripeCtor, checkoutCreate, checkoutRetrieve } = vi.hoisted(() => {
  const checkoutCreate = vi.fn();
  const checkoutRetrieve = vi.fn();
  const stripeCtor = vi.fn(() => ({
    checkout: { sessions: { create: checkoutCreate, retrieve: checkoutRetrieve } },
  }));
  return { stripeCtor, checkoutCreate, checkoutRetrieve };
});

vi.mock('stripe', () => ({ default: stripeCtor }));

// Imported after the mock is registered (vi.mock is hoisted above imports anyway).
import { StripeService } from './stripe.service.js';

function make(stripe: { secretKey: string; currency: string }) {
  const config = { stripe };
  const service = new StripeService(config as never);
  return { service, config };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StripeService.currency', () => {
  it('returns the configured currency', () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'usd' });
    expect(service.currency).toBe('usd');
  });
});

describe('StripeService.fromStripe', () => {
  it('passes zero-decimal currencies straight through', () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'rwf' });
    expect(service.fromStripe(5000)).toBe(5000);
  });

  it('divides cents back to whole units for decimal currencies', () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'usd' });
    expect(service.fromStripe(12345)).toBe(123);
  });
});

describe('StripeService.createTopUpSession', () => {
  it('throws ServiceUnavailable when no secret key is configured', async () => {
    const { service } = make({ secretKey: '', currency: 'usd' });
    await expect(
      service.createTopUpSession({
        companyId: 'c1',
        amount: 10,
        successUrl: 's',
        cancelUrl: 'x',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(stripeCtor).not.toHaveBeenCalled();
  });

  it('builds a checkout session with cents for decimal currencies', async () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'usd' });
    checkoutCreate.mockResolvedValue({ id: 'cs_1', url: 'https://pay' });

    const session = await service.createTopUpSession({
      companyId: 'c1',
      amount: 25,
      successUrl: 'ok',
      cancelUrl: 'no',
    });

    expect(session).toEqual({ id: 'cs_1', url: 'https://pay' });
    expect(stripeCtor).toHaveBeenCalledWith('sk_test');
    const arg = checkoutCreate.mock.calls[0][0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(2500);
    expect(arg.line_items[0].price_data.currency).toBe('usd');
    expect(arg.metadata).toEqual({ companyId: 'c1', kind: 'wallet_topup' });
    expect(arg.success_url).toBe('ok');
    expect(arg.cancel_url).toBe('no');
  });

  it('uses whole units for zero-decimal currencies', async () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'rwf' });
    checkoutCreate.mockResolvedValue({ id: 'cs_2', url: 'https://pay' });

    await service.createTopUpSession({
      companyId: 'c2',
      amount: 5000,
      successUrl: 'ok',
      cancelUrl: 'no',
    });

    const arg = checkoutCreate.mock.calls[0][0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(5000);
  });

  it('constructs the Stripe client only once (caches it)', async () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'usd' });
    checkoutCreate.mockResolvedValue({ id: 'cs', url: 'u' });

    await service.createTopUpSession({
      companyId: 'c1',
      amount: 1,
      successUrl: 'a',
      cancelUrl: 'b',
    });
    await service.createTopUpSession({
      companyId: 'c1',
      amount: 1,
      successUrl: 'a',
      cancelUrl: 'b',
    });

    expect(stripeCtor).toHaveBeenCalledTimes(1);
  });
});

describe('StripeService.retrieveSession', () => {
  it('retrieves a checkout session by id', async () => {
    const { service } = make({ secretKey: 'sk_test', currency: 'usd' });
    checkoutRetrieve.mockResolvedValue({ id: 'cs_9', payment_status: 'paid' });

    const session = await service.retrieveSession('cs_9');

    expect(session).toEqual({ id: 'cs_9', payment_status: 'paid' });
    expect(checkoutRetrieve).toHaveBeenCalledWith('cs_9');
  });

  it('throws ServiceUnavailable when unconfigured', () => {
    // retrieveSession is not async, so the getter throws synchronously here.
    const { service } = make({ secretKey: '', currency: 'usd' });
    expect(() => service.retrieveSession('cs_9')).toThrow(
      ServiceUnavailableException,
    );
  });
});

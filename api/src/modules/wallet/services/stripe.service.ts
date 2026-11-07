import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../../../config/app-config.service.js';

// Stripe charges zero-decimal currencies (e.g. RWF) in whole units; others in cents.
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf',
  'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  constructor(private readonly config: AppConfigService) {}

  get currency(): string {
    return this.config.stripe.currency;
  }

  private get stripe(): Stripe {
    if (this.client) return this.client;
    const { secretKey } = this.config.stripe;
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Payments are not configured — set STRIPE_SECRET_KEY to enable wallet top-ups.',
      );
    }
    this.client = new Stripe(secretKey);
    return this.client;
  }

  /** Convert a wallet amount (whole currency units) to Stripe's unit_amount. */
  private toStripe(amount: number): number {
    return ZERO_DECIMAL.has(this.currency) ? amount : amount * 100;
  }

  /** Convert a Stripe amount back to whole currency units. */
  fromStripe(amount: number): number {
    return ZERO_DECIMAL.has(this.currency) ? amount : Math.round(amount / 100);
  }

  async createTopUpSession(params: {
    companyId: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: this.currency,
            product_data: { name: 'D·Pathway wallet top-up' },
            unit_amount: this.toStripe(params.amount),
          },
          quantity: 1,
        },
      ],
      metadata: { companyId: params.companyId, kind: 'wallet_topup' },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  retrieveSession(id: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(id);
  }
}

/**
 * In-memory fakes for the third-party integrations, installed in every test app
 * so the suite never reaches Stripe, Resend, or the network. They implement just
 * the surface the app calls, and record activity for optional assertions.
 */

export interface FakeCheckoutSession {
  id: string;
  url: string;
  payment_status: 'paid' | 'unpaid';
  amount_total: number;
  metadata: { companyId?: string; kind?: string };
}

/** Stands in for StripeService — issues "paid" checkout sessions deterministically. */
export class FakeStripeService {
  readonly currency = 'rwf';
  private readonly sessions = new Map<string, FakeCheckoutSession>();
  private seq = 0;

  // RWF is zero-decimal, so wallet units map 1:1 to Stripe amounts.
  fromStripe(amount: number): number {
    return amount;
  }

  toStripe(amount: number): number {
    return amount;
  }

  async createTopUpSession(params: {
    companyId: string;
    amount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<FakeCheckoutSession> {
    this.seq += 1;
    const id = `cs_test_${this.seq}`;
    const session: FakeCheckoutSession = {
      id,
      url: params.successUrl.replace('{CHECKOUT_SESSION_ID}', id),
      payment_status: 'paid',
      amount_total: params.amount,
      metadata: { companyId: params.companyId, kind: 'wallet_topup' },
    };
    this.sessions.set(id, session);
    return session;
  }

  async retrieveSession(id: string): Promise<FakeCheckoutSession> {
    return (
      this.sessions.get(id) ?? {
        id,
        url: '',
        payment_status: 'unpaid',
        amount_total: 0,
        metadata: {},
      }
    );
  }
}

export interface SentEmail {
  to?: string;
  graduateId?: string;
  companyId?: string;
  subject: string;
}

/** Stands in for MailService — records would-be sends instead of calling Resend. */
export class FakeMailService {
  readonly sent: SentEmail[] = [];

  async send(to: string, subject: string): Promise<void> {
    this.sent.push({ to, subject });
  }

  async notifyGraduate(graduateId: string, subject: string): Promise<void> {
    this.sent.push({ graduateId, subject });
  }

  async notifyCompany(companyId: string, subject: string): Promise<void> {
    this.sent.push({ companyId, subject });
  }

  clear(): void {
    this.sent.length = 0;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  PrizeStatus,
  WalletOwnerType,
  WalletTxnType,
} from '../../../common/enums/index.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { Company } from '../../companies/entities/company.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { WalletTransaction } from '../entities/wallet-transaction.entity.js';
import { StripeService } from './stripe.service.js';

@Injectable()
export class WalletService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    @InjectRepository(Graduate) private readonly graduates: Repository<Graduate>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(WalletTransaction)
    private readonly txns: Repository<WalletTransaction>,
    private readonly stripe: StripeService,
    private readonly config: AppConfigService,
  ) {}

  // ---------- transactional escrow helpers (run inside a project transaction) ----------

  /** Reserve a prize out of the company's available balance. */
  async holdPrize(
    m: EntityManager,
    companyId: string,
    amount: number,
    projectId: string,
    label: string,
  ): Promise<void> {
    const company = await m.findOne(Company, { where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found.');
    if (company.balance < amount) {
      throw new ConflictException(
        'Insufficient wallet balance to fund this prize — top up your balance first.',
      );
    }
    company.balance -= amount;
    await m.save(company);
    await this.record(m, WalletOwnerType.COMPANY, companyId, WalletTxnType.HOLD,
      -amount, company.balance, `Prize reserved for “${label}”`, projectId);
  }

  /** Return a held prize to the company's available balance. */
  async refundPrize(
    m: EntityManager,
    companyId: string,
    amount: number,
    projectId: string,
    label: string,
  ): Promise<void> {
    const company = await m.findOne(Company, { where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found.');
    company.balance += amount;
    await m.save(company);
    await this.record(m, WalletOwnerType.COMPANY, companyId, WalletTxnType.REFUND,
      amount, company.balance, `Prize refunded from “${label}”`, projectId);
  }

  /** Release a held prize to the winning student's balance. */
  async releasePrize(
    m: EntityManager,
    graduateId: string,
    amount: number,
    projectId: string,
    label: string,
  ): Promise<void> {
    const grad = await m.findOne(Graduate, { where: { id: graduateId } });
    if (!grad) throw new NotFoundException('Student not found.');
    grad.balance += amount;
    await m.save(grad);
    await this.record(m, WalletOwnerType.GRADUATE, graduateId, WalletTxnType.PAYOUT,
      amount, grad.balance, `Prize awarded for “${label}”`, projectId);
  }

  private async record(
    m: EntityManager,
    ownerType: WalletOwnerType,
    ownerId: string,
    type: WalletTxnType,
    amount: number,
    balanceAfter: number,
    description: string,
    projectId: string | null = null,
    stripeSessionId: string | null = null,
  ): Promise<void> {
    const t = m.create(WalletTransaction, {
      ownerType, ownerId, type, amount, balanceAfter, description, projectId, stripeSessionId,
    });
    await m.save(t);
  }

  // ---------- reads ----------

  async getWallet(user: { id: string; role: string }): Promise<unknown> {
    if (user.role === 'COMPANY') {
      const company = await this.companies.findOne({ where: { userId: user.id } });
      if (!company) throw new NotFoundException('Company profile not found.');
      const row = await this.projects
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.prize_amount), 0)', 'sum')
        .where('p.company_id = :cid', { cid: company.id })
        .andWhere('p.prize_status = :s', { s: PrizeStatus.HELD })
        .getRawOne<{ sum: string }>();
      return {
        role: 'COMPANY',
        currency: this.stripe.currency,
        balance: company.balance,
        reserved: Number(row?.sum ?? 0),
        transactions: await this.ledger(WalletOwnerType.COMPANY, company.id),
      };
    }
    const grad = await this.graduates.findOne({ where: { userId: user.id } });
    if (!grad) throw new NotFoundException('Student profile not found.');
    return {
      role: 'GRADUATE',
      currency: this.stripe.currency,
      balance: grad.balance,
      transactions: await this.ledger(WalletOwnerType.GRADUATE, grad.id),
    };
  }

  private ledger(ownerType: WalletOwnerType, ownerId: string) {
    return this.txns.find({
      where: { ownerType, ownerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // ---------- top-up (Stripe, confirm-on-redirect) ----------

  async createTopUp(userId: string, amount: number): Promise<{ url: string }> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Enter a valid top-up amount.');
    }
    const company = await this.companies.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found.');
    const base = this.config.corsOrigin;
    const session = await this.stripe.createTopUpSession({
      companyId: company.id,
      amount,
      successUrl: `${base}/wallet?topup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/wallet?topup=cancelled`,
    });
    if (!session.url) throw new ConflictException('Could not start the Stripe checkout.');
    return { url: session.url };
  }

  async confirmTopUp(
    userId: string,
    sessionId: string,
  ): Promise<{ balance: number; credited: boolean; amount?: number }> {
    const company = await this.companies.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found.');

    // Idempotent: a session is credited at most once.
    const existing = await this.txns.findOne({
      where: { stripeSessionId: sessionId, type: WalletTxnType.TOPUP },
    });
    if (existing) return { balance: company.balance, credited: false };

    const session = await this.stripe.retrieveSession(sessionId);
    if (session.payment_status !== 'paid') {
      throw new ConflictException('This payment has not completed.');
    }
    if (session.metadata?.companyId !== company.id) {
      throw new ForbiddenException('This checkout session is not yours.');
    }
    const amount = this.stripe.fromStripe(session.amount_total ?? 0);

    return this.dataSource.transaction(async (m) => {
      const c = await m.findOne(Company, { where: { id: company.id } });
      if (!c) throw new NotFoundException('Company not found.');
      c.balance += amount;
      await m.save(c);
      await this.record(m, WalletOwnerType.COMPANY, c.id, WalletTxnType.TOPUP,
        amount, c.balance, 'Wallet top-up', null, sessionId);
      return { balance: c.balance, credited: true, amount };
    });
  }

  // ---------- cash out (recorded withdrawal) ----------

  async withdraw(userId: string, amount: number): Promise<{ balance: number }> {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Enter a valid amount to cash out.');
    }
    return this.dataSource.transaction(async (m) => {
      const grad = await m.findOne(Graduate, { where: { userId } });
      if (!grad) throw new NotFoundException('Student profile not found.');
      if (grad.balance < amount) {
        throw new ConflictException('You cannot cash out more than your balance.');
      }
      grad.balance -= amount;
      await m.save(grad);
      await this.record(m, WalletOwnerType.GRADUATE, grad.id, WalletTxnType.WITHDRAWAL,
        -amount, grad.balance, 'Cash out', null, null);
      return { balance: grad.balance };
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { AppConfigService } from '../../config/app-config.service.js';
import { User } from '../auth/entities/user.entity.js';
import { Graduate } from '../graduates/entities/graduate.entity.js';
import { Company } from '../companies/entities/company.entity.js';

/**
 * Transactional email via Resend. Degrades gracefully: when RESEND_API_KEY is
 * unset the mailer logs the intended message and returns, so every flow works
 * without email configured. Once the key is set the same calls deliver mail.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: Resend | null = null;
  private initialised = false;

  constructor(
    private readonly config: AppConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Graduate)
    private readonly graduates: Repository<Graduate>,
    @InjectRepository(Company)
    private readonly companies: Repository<Company>,
  ) {}

  private getClient(): Resend | null {
    if (this.initialised) return this.client;
    this.initialised = true;
    const { apiKey } = this.config.mail;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged, not sent.',
      );
      return null;
    }
    this.client = new Resend(apiKey);
    return this.client;
  }

  /** Low-level send. Never throws into the caller — email is best-effort. */
  async send(to: string, subject: string, html: string): Promise<void> {
    if (!to) return;
    const client = this.getClient();
    if (!client) {
      this.logger.log(`[email skipped] to=${to} subject="${subject}"`);
      return;
    }
    try {
      const { error } = await client.emails.send({
        from: this.config.mail.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Email to ${to} failed: ${error.message}`);
        return;
      }
      this.logger.log(`Email sent to ${to}: "${subject}"`);
    } catch (err) {
      this.logger.error(`Email to ${to} failed: ${(err as Error).message}`);
    }
  }

  private async emailForUser(userId: string): Promise<string | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    return user?.email ?? null;
  }

  /** Resolve a graduate's login email and send. */
  async notifyGraduate(
    graduateId: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const graduate = await this.graduates.findOne({ where: { id: graduateId } });
    if (!graduate) return;
    const email = await this.emailForUser(graduate.userId);
    if (email) await this.send(email, subject, html);
  }

  /** Resolve a company's login email and send. */
  async notifyCompany(
    companyId: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) return;
    const email = await this.emailForUser(company.userId);
    if (email) await this.send(email, subject, html);
  }
}

import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { WalletOwnerType, WalletTxnType } from '../../../common/enums/index.js';

/**
 * Append-only wallet ledger. One row per money movement for a company or a
 * graduate. `amount` is a signed delta to that owner's balance (credit > 0,
 * debit < 0); `balanceAfter` is their balance once the row was applied.
 */
@Entity('wallet_transactions')
export class WalletTransaction extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: WalletOwnerType })
  ownerType!: WalletOwnerType;

  @Index()
  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'enum', enum: WalletTxnType })
  type!: WalletTxnType;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'integer' })
  balanceAfter!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'uuid', nullable: true })
  projectId!: string | null;

  /** Stripe Checkout session id for top-ups; also the idempotency key. */
  @Index()
  @Column({ type: 'varchar', nullable: true })
  stripeSessionId!: string | null;
}

import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { ActivityType } from '../../../common/enums/index.js';

/**
 * An outbox/activity record written by the BullMQ worker when a domain event is
 * processed (deliverable submitted, evaluation recorded). Feeds the activity
 * list on each dashboard and is where notifications would later hang off.
 */
@Entity('activities')
export class Activity extends BaseEntity {
  @Column({ type: 'enum', enum: ActivityType })
  type!: ActivityType;

  @Column({ type: 'text' })
  message!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  graduateId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;
}

import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { MembershipStatus } from '../../../common/enums/index.js';
import { Application } from './application.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';

/**
 * A teammate the lead invited onto an application. The lead is the
 * Application.graduateId itself; memberships only track invited members. One row
 * per (application, graduate); accepting the application accepts the whole team.
 */
@Entity('application_memberships')
@Unique('uq_membership_application_graduate', ['applicationId', 'graduateId'])
export class ApplicationMembership extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: MembershipStatus, default: MembershipStatus.INVITED })
  status!: MembershipStatus;

  @Column({ type: 'timestamptz' })
  invitedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  applicationId!: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application!: Relation<Application>;

  @Index()
  @Column({ type: 'uuid' })
  graduateId!: string;

  @ManyToOne(() => Graduate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduate_id' })
  graduate!: Relation<Graduate>;
}

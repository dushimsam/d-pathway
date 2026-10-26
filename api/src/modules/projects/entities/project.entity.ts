import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { DeliverableFormat, ProjectStatus } from '../../../common/enums/index.js';
import { Company } from '../../companies/entities/company.entity.js';

/**
 * A company-posted bounded task. Authored in DRAFT, published to OPEN, moves to
 * IN_PROGRESS when the application deadline passes, then CLOSED.
 */
@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text' })
  brief!: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  requiredSkills!: string[];

  @Column({ type: 'timestamptz' })
  applicationDeadline!: Date;

  @Column({ type: 'timestamptz' })
  submissionDeadline!: Date;

  @Column({ type: 'enum', enum: DeliverableFormat })
  deliverableFormat!: DeliverableFormat;

  @Column({ type: 'text' })
  ipTerms!: string;

  // Optional prize (Devpost-style). A project "has a prize" when prizeAmount is set.
  @Column({ type: 'integer', nullable: true })
  prizeAmount!: number | null;

  @Column({ type: 'varchar', length: 8, nullable: true, default: 'RWF' })
  prizeCurrency!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status!: ProjectStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Relation<Company>;
}

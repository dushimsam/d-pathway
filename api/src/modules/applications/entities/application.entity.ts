import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { ApplicationStatus } from '../../../common/enums/index.js';
import { Project } from '../../projects/entities/project.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';

/** One graduate applying to one project. At most one per (project, graduate). */
@Entity('applications')
@Unique('uq_application_project_graduate', ['projectId', 'graduateId'])
export class Application extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status!: ApplicationStatus;

  @Column({ type: 'timestamptz' })
  termsAcceptedAt!: Date;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'text', nullable: true })
  declineReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Relation<Project>;

  @Index()
  @Column({ type: 'uuid' })
  graduateId!: string;

  @ManyToOne(() => Graduate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduate_id' })
  graduate!: Relation<Graduate>;
}

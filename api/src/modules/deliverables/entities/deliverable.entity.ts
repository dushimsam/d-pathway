import { Check, Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Application } from '../../applications/entities/application.entity.js';

/** The single piece of evidence a graduate submits for an accepted application. */
@Entity('deliverables')
@Check('ck_deliverable_has_target', '"link_url" IS NOT NULL OR "file_url" IS NOT NULL')
export class Deliverable extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  fileUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  filePublicId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  linkUrl!: string | null;

  @Column({ type: 'text' })
  note!: string;

  @Column({ type: 'timestamptz' })
  submittedAt!: Date;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  applicationId!: string;

  @OneToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application!: Relation<Application>;
}

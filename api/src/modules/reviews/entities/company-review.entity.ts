import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Company } from '../../companies/entities/company.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Project } from '../../projects/entities/project.entity.js';

/**
 * A graduate's rating of a company, written after they worked on one of its
 * briefs. At most one review per (graduate, project) so a company can't be
 * rated twice for the same engagement.
 */
@Entity('company_reviews')
@Unique('uq_company_review_graduate_project', ['graduateId', 'projectId'])
@Check('ck_company_review_rating_range', '"rating" BETWEEN 1 AND 5')
export class CompanyReview extends BaseEntity {
  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Relation<Company>;

  @Index()
  @Column({ type: 'uuid' })
  graduateId!: string;

  @ManyToOne(() => Graduate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'graduate_id' })
  graduate!: Relation<Graduate>;

  @Column({ type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Relation<Project>;
}

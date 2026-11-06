import { Check, Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { EvaluationOutcome } from '../../../common/enums/index.js';
import { Deliverable } from '../../deliverables/entities/deliverable.entity.js';

/**
 * The company's judgement of a deliverable. One row per deliverable; the company
 * may edit it. When the graduate resubmits after an evaluation, `stale` is set so
 * the company knows the verdict no longer reflects the latest work.
 */
@Entity('evaluations')
@Check('ck_evaluation_score_range', '"score" BETWEEN 1 AND 5')
export class Evaluation extends BaseEntity {
  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text' })
  feedback!: string;

  @Column({ type: 'enum', enum: EvaluationOutcome })
  outcome!: EvaluationOutcome;

  @Column({ type: 'timestamptz' })
  evaluatedAt!: Date;

  /** The deliverable version this verdict was made against. */
  @Column({ type: 'int', default: 1 })
  evaluatedVersion!: number;

  /** True when the graduate resubmitted after this evaluation was recorded. */
  @Column({ type: 'boolean', default: false })
  stale!: boolean;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  deliverableId!: string;

  @OneToOne(() => Deliverable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Relation<Deliverable>;
}

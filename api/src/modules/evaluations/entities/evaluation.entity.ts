import { Check, Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { EvaluationOutcome } from '../../../common/enums/index.js';
import { Deliverable } from '../../deliverables/entities/deliverable.entity.js';

/** The single, immutable judgement of a deliverable. Inserted once, never updated. */
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

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  deliverableId!: string;

  @OneToOne(() => Deliverable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable!: Relation<Deliverable>;
}

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Project } from '../../projects/entities/project.entity.js';

/** A graduate's bookmarked brief. At most one per (graduate, project). */
@Entity('saved_briefs')
@Unique('uq_saved_brief_graduate_project', ['graduateId', 'projectId'])
export class SavedBrief extends BaseEntity {
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

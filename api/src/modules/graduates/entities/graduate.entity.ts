import { Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../auth/entities/user.entity.js';

@Entity('graduates')
export class Graduate extends BaseEntity {
  @Column({ type: 'varchar' })
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  education!: string | null;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  skills!: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  links!: string[];

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.graduate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;
}

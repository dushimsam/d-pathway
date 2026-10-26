import { Column, Entity, Index, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../auth/entities/user.entity.js';

@Entity('companies')
export class Company extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  industry!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', nullable: true })
  representativeTitle!: string | null;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;
}

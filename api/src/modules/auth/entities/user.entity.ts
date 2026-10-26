import { Column, Entity, Index, OneToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { UserRole } from '../../../common/enums/index.js';
import { Graduate } from '../../graduates/entities/graduate.entity.js';
import { Company } from '../../companies/entities/company.entity.js';

/** The authentication record. One per login identity. */
@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @OneToOne(() => Graduate, (graduate) => graduate.user)
  graduate?: Relation<Graduate> | null;

  @OneToOne(() => Company, (company) => company.user)
  company?: Relation<Company> | null;
}

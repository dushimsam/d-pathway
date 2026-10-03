import { ApiProperty } from '@nestjs/swagger';
import { Check, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { PathwayStatus } from '../../../common/enums/pathway-status.enum.js';

@Entity({ name: 'pathways' })
@Index(['status'])
@Check('pathways_intake_quota_positive', '"intake_quota" >= 1')
@Check('pathways_deadline_months_positive', '"deadline_months" >= 1')
export class Pathway extends BaseEntity {
  @ApiProperty({ example: 'Junior DevOps Engineer Pathway' })
  @Column({ type: 'varchar', length: 120 })
  title: string;

  @ApiProperty({ example: 'Irembo Ltd' })
  @Column({ type: 'varchar', length: 120 })
  companyName: string;

  @ApiProperty({ nullable: true, type: String })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'BSc SE/CS, GPA 3.0+, graduated within 24 months' })
  @Column({ type: 'text' })
  eligibilityCriteria: string;

  @ApiProperty({ example: 12, minimum: 1 })
  @Column({ type: 'int' })
  intakeQuota: number;

  @ApiProperty({ example: 6, minimum: 1, default: 6 })
  @Column({ type: 'int', default: 6 })
  deadlineMonths: number;

  @ApiProperty({ enum: PathwayStatus, default: PathwayStatus.DRAFT })
  @Column({ type: 'enum', enum: PathwayStatus, default: PathwayStatus.DRAFT })
  status: PathwayStatus;

  @ApiProperty({ nullable: true, type: Date })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}

import { ApiProperty } from '@nestjs/swagger';
import { PathwayStatus } from '../../../common/enums/pathway-status.enum.js';
import { Pathway } from '../entities/pathway.entity.js';

export class PathwayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty()
  eligibilityCriteria: string;

  @ApiProperty()
  intakeQuota: number;

  @ApiProperty()
  deadlineMonths: number;

  @ApiProperty({ enum: PathwayStatus })
  status: PathwayStatus;

  @ApiProperty({ nullable: true, type: Date })
  publishedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(pathway: Pathway) {
    this.id = pathway.id;
    this.title = pathway.title;
    this.companyName = pathway.companyName;
    this.description = pathway.description;
    this.eligibilityCriteria = pathway.eligibilityCriteria;
    this.intakeQuota = pathway.intakeQuota;
    this.deadlineMonths = pathway.deadlineMonths;
    this.status = pathway.status;
    this.publishedAt = pathway.publishedAt;
    this.createdAt = pathway.createdAt;
    this.updatedAt = pathway.updatedAt;
  }
}

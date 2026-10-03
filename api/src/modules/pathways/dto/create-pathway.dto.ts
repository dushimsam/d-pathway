import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePathwayDto {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Junior DevOps Engineer Pathway' })
  @IsString()
  @Length(3, 120)
  title: string;

  @ApiProperty({ maxLength: 120, example: 'Irembo Ltd' })
  @IsString()
  @Length(1, 120)
  companyName: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ maxLength: 2000, example: 'BSc SE/CS, GPA 3.0+, graduated within 24 months' })
  @IsString()
  @MaxLength(2000)
  eligibilityCriteria: string;

  @ApiProperty({ minimum: 1, example: 12 })
  @IsInt()
  @Min(1)
  intakeQuota: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 60, default: 6, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  deadlineMonths?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class CatalogueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by company id' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by a single required skill' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Only projects offering a prize' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPrize?: boolean;
}

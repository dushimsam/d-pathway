import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitDeliverableDto {
  @ApiPropertyOptional({ description: 'Repository or external link.' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({ description: 'Cloudinary secure URL of an uploaded file.' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Cloudinary public id, stored alongside fileUrl.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filePublicId?: string;

  @ApiProperty({ description: 'Message to the reviewer.' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  note!: string;
}

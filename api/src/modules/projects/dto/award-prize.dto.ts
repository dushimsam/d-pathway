import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AwardPrizeDto {
  @ApiProperty({ description: 'The accepted student who wins the prize.' })
  @IsUUID()
  graduateId!: string;
}

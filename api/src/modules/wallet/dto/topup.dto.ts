import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class TopUpDto {
  @ApiProperty({ description: 'Amount to add to the wallet, in whole currency units.' })
  @IsInt()
  @Min(1)
  amount!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ description: 'Amount to cash out, in whole currency units.' })
  @IsInt()
  @Min(1)
  amount!: number;
}

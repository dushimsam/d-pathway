import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteTeammateDto {
  @ApiProperty({ description: 'Account email of the student to invite.' })
  @IsEmail()
  email!: string;
}

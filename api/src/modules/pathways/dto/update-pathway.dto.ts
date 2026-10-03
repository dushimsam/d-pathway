import { PartialType } from '@nestjs/swagger';
import { CreatePathwayDto } from './create-pathway.dto.js';

export class UpdatePathwayDto extends PartialType(CreatePathwayDto) {}

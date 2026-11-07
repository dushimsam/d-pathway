import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { UserRole } from '../../../common/enums/index.js';
import { ReviewsService } from '../services/reviews.service.js';
import { CreateReviewDto } from '../dto/create-review.dto.js';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @ApiBearerAuth()
  @Roles(UserRole.GRADUATE)
  @Post('reviews')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.GRADUATE)
  @Get('reviews/mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.reviews.listMine(user.id);
  }

  // Public: anyone can see a company's reputation.
  @Public()
  @Get('companies/:id/reviews')
  listForCompany(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.listForCompany(id);
  }
}

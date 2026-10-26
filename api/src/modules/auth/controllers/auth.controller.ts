import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator.js';
import { CurrentUser, type AuthUser } from '../../../common/decorators/current-user.decorator.js';
import { AuthService } from '../services/auth.service.js';
import { RegisterGraduateDto } from '../dto/register-graduate.dto.js';
import { RegisterCompanyDto } from '../dto/register-company.dto.js';
import { LoginDto } from '../dto/login.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register/graduate')
  registerGraduate(@Body() dto: RegisterGraduateDto) {
    return this.auth.registerGraduate(dto);
  }

  @Public()
  @Post('register/company')
  registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.auth.registerCompany(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}

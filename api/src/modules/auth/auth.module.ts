import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '../../config/app-config.service.js';
import { GraduatesModule } from '../graduates/graduates.module.js';
import { CompaniesModule } from '../companies/companies.module.js';
import { User } from './entities/user.entity.js';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        // expiresIn accepts the ms StringValue form (e.g. "24h") at runtime.
        signOptions: { expiresIn: config.jwtExpiresIn } as JwtSignOptions,
      }),
    }),
    GraduatesModule,
    CompaniesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

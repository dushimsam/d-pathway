import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../../../common/enums/index.js';
import { GraduatesService } from '../../graduates/services/graduates.service.js';
import { CompaniesService } from '../../companies/services/companies.service.js';
import { User } from '../entities/user.entity.js';
import { RegisterGraduateDto } from '../dto/register-graduate.dto.js';
import { RegisterCompanyDto } from '../dto/register-company.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import type { JwtPayload } from '../jwt.strategy.js';

const BCRYPT_COST = 10;

export interface AuthUserView {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUserView;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly graduates: GraduatesService,
    private readonly companies: CompaniesService,
  ) {}

  private static normaliseEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private signToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.sign(payload);
  }

  private view(user: Pick<User, 'id' | 'email' | 'role'>): AuthUserView {
    return { id: user.id, email: user.email, role: user.role };
  }

  async registerGraduate(dto: RegisterGraduateDto): Promise<AuthResult> {
    const email = AuthService.normaliseEmail(dto.email);
    await this.assertEmailFree(email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.dataSource.transaction(async (manager) => {
      const created = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          email,
          passwordHash,
          role: UserRole.GRADUATE,
        }),
      );
      await this.graduates.createForUser(
        created.id,
        {
          fullName: dto.fullName,
          education: dto.education ?? null,
          skills: dto.skills,
          location: dto.location ?? null,
        },
        manager,
      );
      return created;
    });

    return { accessToken: this.signToken(user), user: this.view(user) };
  }

  async registerCompany(dto: RegisterCompanyDto): Promise<AuthResult> {
    const email = AuthService.normaliseEmail(dto.email);
    await this.assertEmailFree(email);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    const user = await this.dataSource.transaction(async (manager) => {
      const created = await manager.getRepository(User).save(
        manager.getRepository(User).create({
          email,
          passwordHash,
          role: UserRole.COMPANY,
        }),
      );
      await this.companies.createForUser(
        created.id,
        {
          name: dto.companyName.trim(),
          industry: dto.industry ?? null,
          representativeTitle: dto.title ?? null,
        },
        manager,
      );
      return created;
    });

    return { accessToken: this.signToken(user), user: this.view(user) };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = AuthService.normaliseEmail(dto.email);
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { accessToken: this.signToken(user), user: this.view(user) };
  }

  /** The current user with their role-specific profile. */
  async me(userId: string): Promise<{
    id: string;
    email: string;
    role: UserRole;
    profile: unknown;
  }> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const profile =
      user.role === UserRole.GRADUATE
        ? await this.graduates.findByUserId(user.id)
        : await this.companies.findByUserId(user.id);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile,
    };
  }

  private async assertEmailFree(email: string): Promise<void> {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }
  }
}

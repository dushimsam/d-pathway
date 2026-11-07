import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Typed, validated access to configuration. Values are guaranteed by Joi. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  private get<T>(key: string): T {
    return this.config.getOrThrow<T>(key);
  }

  get nodeEnv(): string {
    return this.get<string>('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.get<number>('PORT');
  }

  get corsOrigin(): string {
    return this.get<string>('CORS_ORIGIN');
  }

  get databaseUrl(): string {
    return this.get<string>('DATABASE_URL');
  }

  get redisUrl(): string {
    return this.get<string>('REDIS_URL');
  }

  get jwtSecret(): string {
    return this.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.get<string>('JWT_EXPIRES_IN');
  }

  get cloudinary(): {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadFolder: string;
  } {
    return {
      cloudName: this.get<string>('CLOUDINARY_CLOUD_NAME'),
      apiKey: this.get<string>('CLOUDINARY_API_KEY'),
      apiSecret: this.get<string>('CLOUDINARY_API_SECRET'),
      uploadFolder: this.get<string>('CLOUDINARY_UPLOAD_FOLDER'),
    };
  }

  get stripe(): { secretKey: string; currency: string } {
    return {
      secretKey: this.get<string>('STRIPE_SECRET_KEY'),
      currency: this.get<string>('STRIPE_CURRENCY'),
    };
  }

  get mail(): { apiKey: string; from: string } {
    return {
      apiKey: this.get<string>('RESEND_API_KEY'),
      from: this.get<string>('MAIL_FROM'),
    };
  }
}

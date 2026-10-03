import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'Service and database health.',
    schema: {
      example: { status: 'ok', db: 'ok' },
    },
  })
  async check(): Promise<{ status: string; db: string }> {
    let db = 'ok';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      db = 'down';
    }
    return { status: 'ok', db };
  }
}

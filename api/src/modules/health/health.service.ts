import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async check(): Promise<{ status: 'ok'; db: 'ok' | 'down' }> {
    let db: 'ok' | 'down' = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      db = 'ok';
    } catch {
      db = 'down';
    }
    return { status: 'ok', db };
  }
}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  private readonly version: string;

  constructor(private readonly appService: AppService) {
    try {
      const versionFile = join(__dirname, '..', '..', 'version.json');
      const { version } = JSON.parse(readFileSync(versionFile, 'utf8'));
      this.version = version;
    } catch {
      this.version = 'unknown';
    }
  }

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string; version: string; timestamp: string } {
    return {
      status: 'ok',
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get the default app root response' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/info')
  @ApiOperation({ summary: 'Get app metadata' })
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}

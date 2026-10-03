import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './auth.dto.js';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a Google ID token and issue an internal JWT' })
  @ApiResponse({ status: 200, description: 'Google identity verified and token issued' })
  @ApiResponse({ status: 401, description: 'The Google ID token is invalid' })
  async googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Identity Services ID token returned to the frontend',
  })
  @IsString()
  @MinLength(20)
  idToken: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Identity Services ID token returned to the frontend',
  })
  @IsString()
  @MinLength(20)
  idToken: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Aisha Al-Farooqi', description: 'Full name of the student' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'aisha@example.com', description: 'Valid email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Strong password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'aisha@example.com', description: 'Account email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account password' })
  @IsString()
  @MinLength(1)
  password: string;
}

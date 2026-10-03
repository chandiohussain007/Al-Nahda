import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Identity Services ID token returned to the frontend',
  })
  @IsString()
  @MinLength(20)
  idToken: string;

  @ApiPropertyOptional({
    enum: [UserRole.STUDENT, UserRole.TEACHER],
    description:
      'Requested role. Defaults to STUDENT when omitted. ADMIN is never accepted here.',
  })
  @IsOptional()
  @IsIn([UserRole.STUDENT, UserRole.TEACHER])
  role?: UserRole;
}

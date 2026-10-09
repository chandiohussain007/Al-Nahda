import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Plain offset/limit slice accepted by the service layer. */
export interface Pagination {
  skip?: number;
  take?: number;
}

/**
 * Optional offset/limit query params shared by every list endpoint.
 *
 * Both params are optional: omitting them preserves the historical
 * "return everything" behaviour, so existing clients are unaffected.
 */
export class PaginationQueryDto implements Pagination {
  @ApiPropertyOptional({ description: 'Number of rows to skip', minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of rows to return',
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  take?: number;
}

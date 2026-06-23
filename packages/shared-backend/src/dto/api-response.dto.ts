import { ApiProperty } from '@nestjs/swagger';

export class ApiBaseResponseDto {
  code!: number;
  timestamp!: string;
  message!: string;
}

export class ApiResponseDto<T> extends ApiBaseResponseDto {
  data!: T;
  path?: string;
  requestId?: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page', example: 1, type: Number })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 10, type: Number })
  limit!: number;

  @ApiProperty({ description: 'Total item count', example: 100, type: Number })
  total!: number;

  @ApiProperty({ description: 'Total page count', example: 10, type: Number })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
    type: Boolean,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
    type: Boolean,
  })
  hasPreviousPage!: boolean;
}

export class PaginatedResultDto<T> {
  items!: T[];
  meta!: PaginationMetaDto;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMetaDto {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

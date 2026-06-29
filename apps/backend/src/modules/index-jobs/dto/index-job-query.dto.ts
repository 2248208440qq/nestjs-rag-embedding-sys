import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import type { IndexJobStatus, IndexJobType } from '@repo/shared-types';

import { INDEX_JOB_STATUSES, INDEX_JOB_TYPES } from '@/common/constants';

export class IndexJobQueryDto {
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsUUID()
  parentJobId?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  @IsIn(INDEX_JOB_STATUSES)
  @IsOptional()
  status?: IndexJobStatus;

  @IsIn(INDEX_JOB_TYPES)
  @IsOptional()
  type?: IndexJobType;
}

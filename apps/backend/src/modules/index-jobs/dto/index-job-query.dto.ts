import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import type { IndexJobStatus, IndexJobType } from '@repo/shared-types';

const JOB_STATUSES: IndexJobStatus[] = [
  'canceled',
  'failed',
  'pending',
  'running',
  'succeeded',
];

const JOB_TYPES: IndexJobType[] = [
  'delete_document_index',
  'parse_document',
  'rebuild_all_indexes',
  'rebuild_document_index',
];

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

  @IsIn(JOB_STATUSES)
  @IsOptional()
  status?: IndexJobStatus;

  @IsIn(JOB_TYPES)
  @IsOptional()
  type?: IndexJobType;
}

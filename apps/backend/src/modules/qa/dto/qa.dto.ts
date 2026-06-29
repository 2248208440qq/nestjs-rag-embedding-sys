import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { MAX_QA_TOP_K } from '@/common/constants';

export class QaRequestDto {
  @IsString()
  question!: string;

  @IsInt()
  @Max(MAX_QA_TOP_K)
  @Min(1)
  @IsOptional()
  topK?: number;

  @IsArray()
  @IsOptional()
  knowledgeBaseIds?: string[];
}

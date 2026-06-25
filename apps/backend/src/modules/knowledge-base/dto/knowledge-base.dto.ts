import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import type { KnowledgeBaseStatus } from '@repo/shared-types';

export class CreateKnowledgeBaseDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsIn(['active', 'archived'])
  @IsOptional()
  status?: KnowledgeBaseStatus;
}

export class UpdateKnowledgeBaseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsIn(['active', 'archived'])
  @IsOptional()
  status?: KnowledgeBaseStatus;
}

export class BindKnowledgeBaseDocumentsDto {
  @IsArray()
  documentIds!: string[];
}

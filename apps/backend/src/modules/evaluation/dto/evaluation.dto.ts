import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluationCaseDto {
  @IsString()
  query!: string;

  @IsArray()
  @IsOptional()
  expectedDocumentIds?: string[];

  @IsArray()
  @IsOptional()
  expectedChunkIds?: string[];

  @IsArray()
  @IsOptional()
  expectedArticleRefs?: string[];

  @IsArray()
  @IsOptional()
  expectedKeywords?: string[];

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class RunEvaluationDto {
  @IsUUID()
  @IsOptional()
  caseId?: string;

  @IsString()
  @IsOptional()
  query?: string;

  @IsInt()
  @Max(50)
  @Min(1)
  @IsOptional()
  topK?: number;
}

import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QaRequestDto {
  @IsString()
  question!: string;

  @IsInt()
  @Max(20)
  @Min(1)
  @IsOptional()
  topK?: number;

  @IsArray()
  @IsOptional()
  knowledgeBaseIds?: string[];
}

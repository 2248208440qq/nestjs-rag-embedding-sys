import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const DEPT_STATUSES = ['active', 'inactive'] as const;

export class CreateDeptDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ enum: DEPT_STATUSES, example: 'active' })
  @IsOptional()
  @IsEnum(DEPT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ example: 'R&D department' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ description: 'Parent department ID' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateDeptDto extends PartialType(CreateDeptDto) {}

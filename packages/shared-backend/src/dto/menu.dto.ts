import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const MENU_TYPES = ['catalog', 'menu', 'button'] as const;
export const MENU_STATUSES = ['active', 'inactive'] as const;

export class CreateMenuDto {
  @ApiProperty({ example: 'system' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '/system' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  path!: string;

  @ApiPropertyOptional({ example: 'system/index' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  component?: string;

  @ApiPropertyOptional({ example: 'lucide:settings' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({ enum: MENU_TYPES, example: 'menu' })
  @IsEnum(MENU_TYPES)
  type!: string;

  @ApiPropertyOptional({ enum: MENU_STATUSES, example: 'active' })
  @IsOptional()
  @IsEnum(MENU_STATUSES)
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  orderNo?: number;

  @ApiPropertyOptional({ description: 'Menu metadata (title, icon, etc.)' })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Parent menu ID' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}

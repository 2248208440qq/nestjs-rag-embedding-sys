import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ example: 'Admin' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  realName?: string;

  @ApiPropertyOptional({ example: '/rag/search' })
  @IsOptional()
  @IsString()
  homePath?: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ example: ['admin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleNames?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deptId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

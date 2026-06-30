import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import type { AgentChatRequest, AgentType } from '@repo/shared-types';

import { MAX_QA_TOP_K } from '@/common/constants';

const AGENT_TYPES: AgentType[] = [
  'document_review',
  'legal_qa',
  'legal_research',
];

export class AgentChatDto implements AgentChatRequest {
  @IsIn(AGENT_TYPES)
  @IsOptional()
  agentType?: AgentType;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  knowledgeBaseIds?: string[];

  @IsString()
  message!: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsBoolean()
  @IsOptional()
  stream?: boolean;

  @IsInt()
  @Max(MAX_QA_TOP_K)
  @Min(1)
  @IsOptional()
  topK?: number;
}

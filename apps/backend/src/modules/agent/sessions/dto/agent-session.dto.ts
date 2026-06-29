import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type {
  AgentSessionStatus,
  AgentType,
  CreateAgentSessionRequest,
  UpdateAgentSessionRequest,
} from '@repo/shared-types';

const AGENT_TYPES: AgentType[] = [
  'document_review',
  'legal_qa',
  'legal_research',
];
const AGENT_SESSION_STATUSES: AgentSessionStatus[] = ['active', 'archived'];

export class CreateAgentSessionDto implements CreateAgentSessionRequest {
  @IsIn(AGENT_TYPES)
  @IsOptional()
  agentType?: AgentType;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  knowledgeBaseIds?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateAgentSessionDto implements UpdateAgentSessionRequest {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  knowledgeBaseIds?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsIn(AGENT_SESSION_STATUSES)
  @IsOptional()
  status?: AgentSessionStatus;

  @IsString()
  @IsOptional()
  title?: string;
}

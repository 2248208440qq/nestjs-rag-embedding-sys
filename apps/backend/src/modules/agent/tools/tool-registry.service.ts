import { Injectable } from '@nestjs/common';

import { CitationValidatorTool } from '@/modules/agent/tools/builtin/citation-validator.tool';
import { LegalSearchTool } from '@/modules/agent/tools/builtin/legal-search.tool';

@Injectable()
export class ToolRegistryService {
  constructor(
    private readonly citationValidatorTool: CitationValidatorTool,
    private readonly legalSearchTool: LegalSearchTool,
  ) {}

  getCitationValidator() {
    return this.citationValidatorTool;
  }

  getLegalSearch() {
    return this.legalSearchTool;
  }
}

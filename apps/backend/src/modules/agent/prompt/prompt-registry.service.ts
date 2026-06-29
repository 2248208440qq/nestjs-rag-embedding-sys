import { Injectable } from '@nestjs/common';

import {
  LEGAL_QA_SYSTEM_PROMPT,
  LEGAL_QA_USER_PROMPT,
} from '@/modules/agent/prompt/templates/legal-qa.prompt';

@Injectable()
export class PromptRegistryService {
  getLegalQaSystemPrompt() {
    return LEGAL_QA_SYSTEM_PROMPT;
  }

  getLegalQaUserPrompt() {
    return LEGAL_QA_USER_PROMPT;
  }
}

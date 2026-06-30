import { Injectable } from '@nestjs/common';

import type { PromptTemplate } from '@/modules/agent/prompt/contracts/prompt-template.interface';

@Injectable()
export class PromptRendererService {
  render<TVariables>(
    template: PromptTemplate<TVariables>,
    variables: TVariables,
  ) {
    return template.render(variables);
  }
}

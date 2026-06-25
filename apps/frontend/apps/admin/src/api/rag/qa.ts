import type { QaRequest, QaResponse } from './types';

import { ragPost } from './http';

export function askLegalQuestion(data: QaRequest) {
  return ragPost<QaResponse>('/qa/ask', data);
}

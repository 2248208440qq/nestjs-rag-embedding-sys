import { describe, expect, it } from '@jest/globals';

import { HealthController } from '@/modules/health/health.controller';

describe('HealthController', () => {
  it('returns service health', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      service: 'rag-embedding-backend',
      status: 'ok',
    });
  });
});

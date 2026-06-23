import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  route?: string;
  clientIp?: string;
  statusCode?: number;
  durationMs?: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

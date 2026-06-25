const SYSTEM_PERMISSIONS = {
  dept: {
    create: 'system:dept:create',
    delete: 'system:dept:delete',
    update: 'system:dept:update',
  },
  menu: {
    create: 'system:menu:create',
    delete: 'system:menu:delete',
    update: 'system:menu:update',
  },
  role: {
    create: 'system:role:create',
    delete: 'system:role:delete',
    update: 'system:role:update',
  },
  user: {
    create: 'system:user:create',
    delete: 'system:user:delete',
    update: 'system:user:update',
  },
} as const;

const RAG_PERMISSIONS = {
  document: {
    delete: 'rag:document:delete',
    index: 'rag:document:index',
    parse: 'rag:document:parse',
    upload: 'rag:document:upload',
  },
  evaluation: {
    create: 'rag:evaluation:create',
    run: 'rag:evaluation:run',
  },
  indexJob: {
    cancel: 'rag:index-job:cancel',
    rebuild: 'rag:index-job:rebuild',
    retry: 'rag:index-job:retry',
  },
  knowledgeBase: {
    create: 'rag:knowledge-base:create',
    delete: 'rag:knowledge-base:delete',
    update: 'rag:knowledge-base:update',
  },
  qa: {
    ask: 'rag:qa:ask',
  },
  search: {
    query: 'rag:search:query',
  },
} as const;

export { RAG_PERMISSIONS, SYSTEM_PERMISSIONS };

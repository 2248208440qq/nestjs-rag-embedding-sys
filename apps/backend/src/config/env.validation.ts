import { z } from 'zod';

const envSchema = z.object({
  APP_NAME: z.string().min(1).default('rag-embedding'),
  API_VERSION: z.string().min(1).default('1.0.0'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  BACKEND_PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z
    .string()
    .url()
    .default(
      'postgresql://rag:rag_password@127.0.0.1:15432/rag_embedding?schema=public',
    ),
  EMBEDDING_BASE_URL: z.string().url().default('http://localhost:8000/v1'),
  EMBEDDING_MODEL: z.string().min(1).default('qwen3-embedding'),
  EMBEDDING_BATCH_SIZE: z.coerce.number().int().min(1).max(128).default(16),
  LLM_ENABLED: z.coerce.boolean().default(false),
  LLM_PROVIDER: z.literal('deepseek').default('deepseek'),
  LLM_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  LLM_MODEL: z.literal('deepseek-v4-flash').default('deepseek-v4-flash'),
  LLM_API_KEY: z.string().optional(),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  JWT_SECRET: z.string().min(1).default('dev-jwt-secret-change-in-production'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  JWT_ISSUER: z.string().min(1).default('rag-embedding'),
  JWT_AUDIENCE: z.string().min(1).default('rag-embedding-api'),
  LOG_LEVEL: z
    .enum(['debug', 'verbose', 'info', 'warn', 'error'])
    .default('debug'),
  LOG_DIR: z.string().min(1).default('logs'),
  LOG_TO_FILE: z.coerce.boolean().default(false),
  LOG_SERVICE_NAME: z.string().min(1).default('backend'),
}).superRefine((config, ctx) => {
  if (config.LLM_ENABLED && !config.LLM_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'LLM_API_KEY is required when LLM_ENABLED=true',
      path: ['LLM_API_KEY'],
    });
  }
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(z.prettifyError(parsed.error));
  }

  return parsed.data;
}

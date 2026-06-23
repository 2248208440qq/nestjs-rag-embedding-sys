interface ApiSuccessResponse<T> {
  data: T;
  status: 'success';
}

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
  status: 'error';
}

type ApiResponse<T> = ApiErrorResponse | ApiSuccessResponse<T>;

const RAG_API_BASE = '/rag-api';

export async function ragRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${RAG_API_BASE}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || payload.status === 'error') {
    const message =
      'error' in payload ? payload.error?.message : response.statusText;
    throw new Error(message || '请求失败');
  }

  return payload.data;
}

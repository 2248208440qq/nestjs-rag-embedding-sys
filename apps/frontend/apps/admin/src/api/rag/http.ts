import { requestClient } from '#/api/request';

export function ragGet<T>(path: string) {
  return requestClient.get<T>(path);
}

export function ragPost<T>(path: string, data?: unknown) {
  return requestClient.post<T>(path, data);
}

export function ragPostForm<T>(path: string, data: FormData) {
  return requestClient.post<T>(path, data, {
    headers: {
      'Content-Type': 'multipart/form-data;charset=utf-8',
    },
  });
}

export function ragDelete<T>(path: string) {
  return requestClient.delete<T>(path);
}

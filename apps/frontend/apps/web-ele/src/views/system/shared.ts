export interface TreeOption extends Record<string, unknown> {
  children?: TreeOption[];
  label: string;
  value: string;
}

export function cleanPayload<T extends Record<string, any>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) return true;
      return value !== '' && value !== undefined && value !== null;
    }),
  ) as T;
}

export function flattenTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap((item) => [
    item,
    ...(item.children ? flattenTree(item.children) : []),
  ]);
}

export function toTreeOptions<T extends { children?: T[]; id: string; name: string }>(
  items: T[],
  disabledId?: string,
): TreeOption[] {
  return items
    .filter((item) => item.id !== disabledId)
    .map((item) => ({
      children: item.children ? toTreeOptions(item.children, disabledId) : undefined,
      label: item.name,
      value: item.id,
    }));
}

export function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

export function statusLabel(status?: string) {
  return status === 'inactive' ? '停用' : '启用';
}

export class RequestError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  constructor(message: string, status: number, fields: Record<string, string> = {}) { super(message); this.name = 'RequestError'; this.status = status; this.fields = fields; }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, credentials: 'same-origin', cache: 'no-store', headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers } });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new RequestError(value?.error || 'The request could not complete. Please try again.', response.status, value?.fields ?? {});
  return value as T;
}

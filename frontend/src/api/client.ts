export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.';
export const statusMessages: Record<number, string> = {
  400: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.',
  409: 'Dữ liệu xung đột với bản ghi hiện có. Vui lòng kiểm tra lại.',
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  422: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.',
  500: 'Máy chủ đang gặp sự cố. Vui lòng thử lại.',
  501: 'Chức năng này chưa có API trong backend hiện tại.',
};
export async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  authHeaders: HeadersInit = {},
): Promise<T> {
  if (!baseUrl) throw new ApiError(0, 'Chưa cấu hình VITE_API_BASE_URL.');
  const headers = new Headers(authHeaders);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
      { ...init, headers },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ApiError(
      0,
      'Không thể kết nối máy chủ. Kiểm tra kết nối và thử lại.',
    );
  }
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !path.replace(/^\//, '').startsWith('api/auth/login')
    )
      window.dispatchEvent(new Event('gym:unauthorized'));
    let detail: string | undefined;
    let fields: Record<string, string> | undefined;
    try {
      const payload: unknown = await response.json();
      if(payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string' && response.status < 500) detail = payload.detail;
      if (
        payload &&
        typeof payload === 'object' &&
        'errors' in payload &&
        payload.errors &&
        typeof payload.errors === 'object'
      )
        fields = Object.fromEntries(
          Object.entries(payload.errors).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map(String).join(' ') : String(value),
          ]),
        );
    } catch {
      /* HTTP status remains authoritative. Never expose raw server responses. */
    }
    throw new ApiError(
      response.status,
      detail ?? statusMessages[response.status] ??
        'Không thể xử lý yêu cầu. Vui lòng thử lại.',
      fields,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

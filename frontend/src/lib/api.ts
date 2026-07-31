import { supabase } from "./supabase";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const authHeader = await getAuthHeader();
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...authHeader,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }

  return res;
}

export const api = {
  get: async <T>(path: string): Promise<T> => (await request(path)).json(),
  post: async <T>(path: string, body?: unknown): Promise<T> =>
    (await request(path, { method: "POST", body: JSON.stringify(body ?? {}) })).json(),
  patch: async <T>(path: string, body?: unknown): Promise<T> =>
    (await request(path, { method: "PATCH", body: JSON.stringify(body ?? {}) })).json(),
  delete: async (path: string): Promise<void> => {
    await request(path, { method: "DELETE" });
  },
  postForm: async <T>(path: string, formData: FormData): Promise<T> =>
    (await request(path, { method: "POST", body: formData })).json(),
};

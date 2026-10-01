/*
  Typed fetch wrapper for the Pricem REST API.
  - Attaches the access token from localStorage (client side).
  - On 401, tries one refresh (httpOnly cookie) and retries the request.
  - Throws ApiRequestError with the backend's message + field errors.
*/

import type { ApiError } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

/** Origin serving static assets (product images) — API host without /api/v1 */
export const ASSET_URL = API_URL.replace(/\/api\/v1\/?$/, "");

/** Resolve backend-relative image paths (/uploads/…) to absolute URLs. */
export function assetUrl(path: string): string {
  return path.startsWith("/") ? `${ASSET_URL}${path}` : path;
}

const ACCESS_TOKEN_KEY = "pricem_access_token";

export class ApiRequestError extends Error {
  status: number;
  errors?: ApiError["errors"];

  constructor(status: number, body: ApiError) {
    super(body.message || "Request failed");
    this.status = status;
    this.errors = body.errors;
  }
}

export const tokenStore = {
  get: (): string | null =>
    typeof window === "undefined"
      ? null
      : localStorage.getItem(ACCESS_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Skip the automatic 401 → refresh → retry cycle (used by auth endpoints). */
  skipRefresh?: boolean;
}

async function rawRequest(path: string, options: RequestOptions) {
  const token = tokenStore.get();
  return fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // send/receive the refresh-token cookie
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    tokenStore.set(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let res = await rawRequest(path, options);

  if (res.status === 401 && !options.skipRefresh && (await tryRefresh())) {
    res = await rawRequest(path, options);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: res.statusText }))) as ApiError;
    throw new ApiRequestError(res.status, body);
  }

  return res.json() as Promise<T>;
}

/**
 * Multipart request (file uploads). Browser sets the Content-Type boundary;
 * same auth + 401→refresh→retry behaviour as api().
 */
export async function apiForm<T>(
  path: string,
  form: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(tokenStore.get()
          ? { Authorization: `Bearer ${tokenStore.get()}` }
          : {}),
      },
      credentials: "include",
      body: form,
    });

  let res = await send();
  if (res.status === 401 && (await tryRefresh())) {
    res = await send();
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ message: res.statusText }))) as ApiError;
    throw new ApiRequestError(res.status, body);
  }

  return res.json() as Promise<T>;
}

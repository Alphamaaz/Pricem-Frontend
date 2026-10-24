/*
  Typed fetch wrapper for the PriceAm REST API.
  - Attaches the access token from localStorage (client side).
  - On 401, tries one refresh (httpOnly cookie) and retries the request.
  - Throws ApiRequestError with the backend's message + field errors.
*/

import type { ApiError } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

/** Origin serving static assets (product images) — API host without /api/v1 */
export const ASSET_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export const PRODUCT_IMAGE_PLACEHOLDER = "/product-placeholder.svg";

// A small number of legacy listings referenced third-party images that were
// later removed. Keep those active listings useful while sellers replace the
// original media, without coupling every image component to migration logic.
const LEGACY_IMAGE_REPLACEMENTS: Record<string, string> = {
  "/uploads/products/1792403597472-1000006599.jpg":
    "/listing-images/toyota-gli-sedan.webp",
  "https://images.unsplash.com/photo-1580481077195-c328a37db71a?auto=format&fit=crop&w=1200&q=85":
    "/listing-images/ergonomic-mesh-chair.webp",
  "https://images.unsplash.com/photo-1608248597359-561307b22d17?auto=format&fit=crop&w=1200&q=85":
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=85",
};

/** Resolve backend-relative image paths (/uploads/…) to absolute URLs. */
export function assetUrl(path: string): string {
  const replacement = LEGACY_IMAGE_REPLACEMENTS[path];
  if (replacement) return replacement;
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

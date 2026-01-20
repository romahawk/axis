// frontend/src/lib/api.ts
// Backward-compatible API helpers.
// This file must NOT hardcode localhost in production.
// It reads API_BASE_URL from config and provides fetchJSON used across the app.

import { API_BASE_URL } from "../config/api";

export const API_BASE = API_BASE_URL;

export function toApiUrl(pathOrUrl: string) {
  // absolute URL: keep as-is
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${path}`;
}

export async function fetchJSON<T>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${txt}`);
  }

  return (await res.json()) as T;
}

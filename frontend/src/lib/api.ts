// frontend/src/lib/api.ts
// Central API helpers for Axis.
// MUST NOT hardcode localhost in production.

import { API_BASE_URL } from "../config/api";

export const API_BASE = API_BASE_URL;

export function toApiUrl(pathOrUrl: string) {
  // Absolute URL → keep as-is
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // Relative path → prefix with API base
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${path}`;
}

export async function fetchJSON<T>(
  pathOrUrl: string,
  init?: RequestInit
): Promise<T> {
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

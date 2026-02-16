import { toApiUrl } from "../config/api";

export async function fetchJSON<T>(pathOrUrl: string): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);

  return res.json() as Promise<T>;
}

export async function postJSON<T>(pathOrUrl: string, body: unknown): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`POST ${url} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function putJSON<T>(pathOrUrl: string, body: unknown): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`PUT ${url} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function patchJSON<T>(pathOrUrl: string, body: unknown): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`PATCH ${url} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function deleteJSON<T>(pathOrUrl: string): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error(`DELETE ${url} -> HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

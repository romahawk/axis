// frontend/src/features/dashboard/api/postJSON.ts
type Json = Record<string, any> | any[];

function apiBase(): string {
  // Works for local dev and Vercel env-based deployments.
  // If VITE_API_BASE_URL is set (e.g. https://your-backend.fly.dev), we prefix.
  const base = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (base ?? "").replace(/\/$/, "");
}

function toApiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  const base = apiBase();
  return base ? `${base}${path}` : path;
}

export async function postJSON<T>(url: string, body: Json): Promise<T> {
  const res = await fetch(toApiUrl(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `POST ${url} failed (${res.status})`);
  }

  return (await res.json()) as T;
}

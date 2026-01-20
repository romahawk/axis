// frontend/src/features/dashboard/api/putJSON.ts

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8000";

function toApiUrl(pathOrUrl: string) {
  // If it's already an absolute URL, keep it
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // Ensure leading slash
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${path}`;
}

export async function putJSON<T>(pathOrUrl: string, body: unknown): Promise<T> {
  const url = toApiUrl(pathOrUrl);

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PUT ${url} failed: ${res.status} ${txt}`);
  }

  return (await res.json()) as T;
}

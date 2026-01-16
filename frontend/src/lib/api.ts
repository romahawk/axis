export const API_BASE = "http://localhost:8000";

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

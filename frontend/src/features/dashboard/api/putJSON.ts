// frontend/src/features/dashboard/api/putJSON.ts
import { toApiUrl } from "../../../config/api";

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

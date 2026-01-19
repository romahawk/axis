// frontend/src/features/dashboard/api/putJSON.ts
export async function putJSON<T>(url: string, body: unknown): Promise<T> {
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

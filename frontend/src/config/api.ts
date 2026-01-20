// frontend/src/config/api.ts

const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
const cleaned = raw?.trim();

export const API_BASE_URL =
  cleaned || (import.meta.env.DEV ? "http://localhost:8000" : "");

// Fail fast in production builds (prevents silently baking localhost again)
if (import.meta.env.PROD && !API_BASE_URL) {
  throw new Error(
    "Missing VITE_API_BASE_URL in production build. Set it in Vercel -> Environment Variables (Production)."
  );
}

export function toApiUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE_URL}${path}`;
}

// frontend/src/config/api.ts
const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const isProd = import.meta.env.PROD;

// In production, never fallback to localhost.
// Fail loudly so you immediately know env is misconfigured.
if (isProd && !raw) {
  throw new Error(
    "VITE_API_BASE_URL is missing in production. Set it in Vercel and redeploy (clear cache)."
  );
}

// In dev, allow localhost fallback.
export const API_BASE_URL = raw || "http://localhost:8000";

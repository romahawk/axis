// frontend/src/config/api.ts
const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const isProd = import.meta.env.PROD;

// In production, do NOT fallback to localhost.
// If the env var is missing, fail loudly so the issue is obvious.
if (isProd && !raw) {
  throw new Error(
    "VITE_API_BASE_URL is missing in production. Set it in Vercel and redeploy."
  );
}

// In dev, allow localhost fallback.
export const API_BASE_URL = raw || "http://localhost:8000";

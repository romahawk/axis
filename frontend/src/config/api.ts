// frontend/src/config/api.ts
const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Allow local dev fallback
export const API_BASE_URL =
  (raw && raw.trim()) || "http://localhost:8000";

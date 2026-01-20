// frontend/src/lib/api.ts
// Backward-compatible shim.
// Do NOT hardcode localhost here.
// Import API_BASE_URL from config so production uses VITE_API_BASE_URL.

import { API_BASE_URL } from "../config/api";

export const API_BASE = API_BASE_URL;

// Central place for environment-driven config.
// Set VITE_API_BASE_URL in a .env (local) or in your hosting provider's
// environment variables (production) to point at your deployed backend.
export const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const API_BASE_URL = `${API_ROOT}/api`;

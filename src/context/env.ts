/**
 * Frontend public config from `.env` / `.env.local`.
 * Next.js inlines NEXT_PUBLIC_* at build time — restart `npm run dev` after changes.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/backend/v1";

export const SOCKET_BASE_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    (() => {
        // If API_BASE_URL is an absolute URL (e.g. http://localhost:3001/backend/v1 in local dev), extract its origin
        if (
            API_BASE_URL.startsWith("http://") ||
            API_BASE_URL.startsWith("https://")
        ) {
            try {
                return new URL(API_BASE_URL).origin;
            } catch {
                // fall through
            }
        }
        // In browser runtime when API_BASE_URL is a relative path like /backend/v1
        if (typeof window !== "undefined" && window.location?.origin) {
            return window.location.origin;
        }
        // Build-time / SSR fallback
        if (process.env.NEXT_PUBLIC_APP_URL) {
            return process.env.NEXT_PUBLIC_APP_URL;
        }
        return "http://localhost:3001";
    })();

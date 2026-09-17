/**
 * Frontend public config from `.env` / `.env.local`.
 * Next.js inlines NEXT_PUBLIC_* at build time — restart `npm run dev` after changes.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/backend/v1";

/** Socket.IO origin (no /backend/v1). Defaults from API host. */
export const SOCKET_BASE_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    (() => {
        try {
            return new URL(API_BASE_URL).origin;
        } catch {
            return "http://localhost:3001";
        }
    })();

/**
 * Frontend public config from `.env` / `.env.local`.
 * Next.js inlines NEXT_PUBLIC_* at build time — restart `npm run dev` after changes.
 */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/backend/v1";

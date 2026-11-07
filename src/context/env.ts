/**
 * Frontend public config from `.env` / `.env.local`.
 * Next.js inlines NEXT_PUBLIC_* at build time — restart `npm run dev` after changes.
 */
/**
 * Helper to dynamically adapt URLs for local offline LAN devices (waiter phones / tablets)
 * WITHOUT touching online cloud domains (e.g., Contabo production).
 */
function resolveDynamicUrl(
    configuredUrl: string,
    fallbackPort = "3001",
): string {
    if (typeof window !== "undefined" && window.location?.hostname) {
        try {
            if (configuredUrl.startsWith("/")) {
                return configuredUrl;
            }
            const parsed = new URL(configuredUrl);
            const isLocalHost =
                parsed.hostname === "localhost" ||
                parsed.hostname === "127.0.0.1" ||
                parsed.hostname === "0.0.0.0";

            // If the configured URL points to localhost, but the user is accessing
            // from another device on the Wi-Fi LAN (e.g. 192.168.x.x, 10.x.x.x, pos.local):
            if (
                isLocalHost &&
                window.location.hostname &&
                !["localhost", "127.0.0.1"].includes(window.location.hostname)
            ) {
                parsed.hostname = window.location.hostname;
                if (!parsed.port) {
                    parsed.port = fallbackPort;
                }
                return parsed.toString().replace(/\/$/, "");
            }
        } catch {
            // fall through to return original
        }
    }
    return configuredUrl;
}

const rawApiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/backend/v1";

export const API_BASE_URL = resolveDynamicUrl(rawApiUrl, "3001");

const rawSocketUrl =
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

export const SOCKET_BASE_URL = resolveDynamicUrl(rawSocketUrl, "3001");

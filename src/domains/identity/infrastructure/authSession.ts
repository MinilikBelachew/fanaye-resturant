const LEGACY_TOKEN_KEY = "fanaye.auth.token";
const LEGACY_REFRESH_KEY = "fanaye.auth.refreshToken";
const LEGACY_EXPIRES_KEY = "fanaye.auth.tokenExpires";
const LEGACY_REMEMBER_KEY = "fanaye.auth.remember";

/** Legacy client-writable flag — cleared on boot/logout; no longer used for auth. */
const LEGACY_AUTH_FLAG_COOKIE = "fanaye_signed_in";

/**
 * HttpOnly session presence cookie set by the API (auth-cookies.service).
 * Middleware gates app routes on this; JS cannot set it.
 */
export const SESSION_COOKIE_NAME = "fanaye_session";

/** Clears leftover client-side auth flag from older builds. */
export function clearLegacyAuthFlagCookie() {
    if (typeof document === "undefined") return;
    document.cookie = `${LEGACY_AUTH_FLAG_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function clearLegacyAuthStorage() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_REFRESH_KEY);
    window.localStorage.removeItem(LEGACY_EXPIRES_KEY);
    window.localStorage.removeItem(LEGACY_REMEMBER_KEY);
    window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    window.sessionStorage.removeItem(LEGACY_REFRESH_KEY);
    window.sessionStorage.removeItem(LEGACY_EXPIRES_KEY);
}

export function loginErrorMessage(payload: unknown) {
    if (payload && typeof payload === "object" && "errors" in payload) {
        const errors = (payload as { errors?: Record<string, string> }).errors;
        const code = errors?.email ?? errors?.password ?? errors?.identifier;
        if (code === "notFound")
            return "No account found for that email or phone.";
        if (code === "incorrectPassword") return "Wrong password.";
        if (code === "accountDisabled") return "This account is disabled.";
        if (code?.startsWith("needLoginViaProvider")) {
            return "This account uses another sign-in method.";
        }
    }
    return "Could not sign in. Check the email or phone and password.";
}

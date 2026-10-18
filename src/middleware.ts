import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME } from "./domains/identity/infrastructure/authSession";

const intlMiddleware = createMiddleware(routing);

const APP_PREFIXES = [
    "/waiter",
    "/cashier",
    "/manager",
    "/owner",
    "/kitchen",
    "/barista",
    "/cakes",
    "/soft-drinks",
    "/dispatcher",
    "/store",
    "/super-admin",
] as const;

const AUTH_PREFIXES = ["/sign-in", "/sign-up", "/forgot-password"] as const;

function stripLocale(pathname: string): string {
    return pathname.replace(/^\/(en|ru|uz|am)/, "") || "/";
}

function localeFromPath(pathname: string): string {
    const match = pathname.match(/^\/(en|ru|uz|am)(?=\/|$)/);
    return match?.[1] ?? routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const rest = stripLocale(pathname);
    // HttpOnly cookie set only by the API — not forgeable via document.cookie.
    const signedIn = request.cookies.get(SESSION_COOKIE_NAME)?.value === "1";

    const isAppRoute = APP_PREFIXES.some(
        prefix => rest === prefix || rest.startsWith(`${prefix}/`),
    );
    const isAuthRoute = AUTH_PREFIXES.some(
        prefix => rest === prefix || rest.startsWith(`${prefix}/`),
    );

    if (isAppRoute && !signedIn) {
        const locale = localeFromPath(pathname);
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/sign-in`;
        url.searchParams.set("next", rest);
        return NextResponse.redirect(url);
    }

    // Let signed-in users stay on sign-in if they want; AppShell still routes home.
    void isAuthRoute;

    return intlMiddleware(request);
}

export const config = {
    matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

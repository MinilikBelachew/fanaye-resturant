"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    AlertCircle,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    Mail,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import { useLoginMutation } from "@/context/services/authApi";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { mapRoleCodeToRole } from "@/domains/identity/application/mapAuthToStaff";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/theme/LocaleSwitcher";

export default function SignInPage() {
    const t = useTranslations("auth.signIn");
    const router = useRouter();
    const current = useAppSelector(selectCurrentStaff);
    const [login, { isLoading }] = useLoginMutation();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState("");

    async function handleCredentialsLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const value = identifier.trim();
        if (!value) {
            setError("Please enter your email or phone number.");
            return;
        }
        if (!password.trim()) {
            setError("Please enter your password.");
            return;
        }

        try {
            const session = await login({
                identifier: value,
                password,
                remember: rememberMe,
            }).unwrap();

            const role = mapRoleCodeToRole(
                session.context.roleCode,
                session.context.stationCode,
            );
            if (session.context.roleCode === "NONE") {
                setError(t("noRestaurantHome"));
                return;
            }

            router.push(homePathForRole(role));
        } catch (err) {
            const message =
                err &&
                typeof err === "object" &&
                "message" in err &&
                typeof err.message === "string"
                    ? err.message
                    : t("errorDefault");
            setError(message);
        }
    }

    return (
        <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#faf9f7] dark:bg-background">
            {/* Top Bar with Locale Switcher */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
                <LocaleSwitcher />
            </div>

            <div className="mx-auto w-full max-w-md my-auto">
                <div className="text-center">
                    <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                        {t("welcomeBack")}
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {t("subTitle")}
                    </p>
                </div>

                <div className="mt-8 rounded-[24px] border border-hairline bg-white p-6 sm:p-8 dark:bg-card">
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-medium text-foreground">
                                {t("emailOrPhone")}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                <Input
                                    type="text"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder={t("emailPlaceholder")}
                                    className="h-11 pl-10 rounded-[12px] text-[14px]"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[13px] font-medium text-foreground">
                                    {t("password")}
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[12px] font-medium text-primary hover:underline"
                                >
                                    {t("forgotPassword")}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t("passwordPlaceholder")}
                                    className="h-11 pl-10 pr-10 rounded-[12px] text-[14px]"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-3 text-slate-gray hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1 text-[13px] text-slate-gray">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="size-4 rounded border-hairline text-primary focus:ring-primary"
                            />
                            <span>{t("rememberMe")}</span>
                        </label>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold transition-all"
                        >
                            {isLoading ? t("signingIn") : t("signInBtn")}
                        </Button>
                    </form>

                    {current && (
                        <div className="mt-4 pt-4 border-t border-hairline text-center">
                            <button
                                type="button"
                                onClick={() => router.push(homePathForRole(current.role))}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                            >
                                <span>{t("resumeSession")} {current.name}</span>
                                <ArrowRight className="size-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-[14px] text-slate-gray">
                    {t("noAccount")}{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-primary hover:underline"
                    >
                        {t("signUpFree")}
                    </Link>
                </p>
            </div>
        </div>
    );
}

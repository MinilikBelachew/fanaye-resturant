"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Check,
    Delete,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    X,
} from "lucide-react";
import { useAppSelector } from "@/context/hooks";
import {
    useLoginMutation,
    usePinLoginMutation,
    type PinTenantMatch,
} from "@/context/services/authApi";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { mapRoleCodeToRole } from "@/domains/identity/application/mapAuthToStaff";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/theme/LocaleSwitcher";
import { getAvatarSolidColor } from "@/lib/avatarColors";
import { cn } from "@/lib/utils";

type AuthMode = "pin" | "credentials";

export default function SignInPage() {
    const t = useTranslations("auth.signIn");
    const router = useRouter();
    const current = useAppSelector(selectCurrentStaff);

    const [mode, setMode] = useState<AuthMode>("pin");
    const [pin, setPin] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    // Multi-tenant disambiguation & terminal state
    const [configuredTenantName, setConfiguredTenantName] = useState<
        string | null
    >(null);
    const [multipleMatches, setMultipleMatches] = useState<
        PinTenantMatch[] | null
    >(null);
    const [pendingPin, setPendingPin] = useState<string>("");

    const [loginWithPin, { isLoading: isPinLoading }] = usePinLoginMutation();
    const [loginWithCredentials, { isLoading: isCredLoading }] =
        useLoginMutation();

    // Check localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const name = localStorage.getItem("terminal_tenant_name");
            if (name) {
                setConfiguredTenantName(name);
            }
        }
    }, []);

    const triggerPinError = (msg?: string) => {
        setError(msg || t("pinError"));
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
    };

    const handlePinSubmit = useCallback(
        async (pinToSubmit?: string) => {
            const code = pinToSubmit ?? pin;
            if (!code || code.length < 4) {
                triggerPinError(t("pinError"));
                return;
            }

            setError("");
            try {
                const storedTenant =
                    typeof window !== "undefined"
                        ? localStorage.getItem("terminal_tenant_id") ||
                          localStorage.getItem("tenant_slug") ||
                          localStorage.getItem("selected_tenant_id") ||
                          undefined
                        : undefined;

                const session = await loginWithPin({
                    pin: code,
                    tenantSlug: storedTenant,
                    remember: rememberMe,
                }).unwrap();

                const role = mapRoleCodeToRole(
                    session.context.roleCode,
                    session.context.stationCode,
                );
                if (session.context.roleCode === "NONE") {
                    triggerPinError(t("noRestaurantHome"));
                    return;
                }

                router.push(homePathForRole(role));
            } catch (err: unknown) {
                const errObj = err as {
                    error?: string;
                    matches?: PinTenantMatch[];
                    message?: string;
                };

                if (
                    errObj?.error === "MULTIPLE_TENANTS_FOUND" &&
                    errObj?.matches &&
                    errObj.matches.length > 0
                ) {
                    setMultipleMatches(errObj.matches);
                    setPendingPin(code);
                    return;
                }

                let message = t("pinError");
                if (
                    err &&
                    typeof err === "object" &&
                    "message" in err &&
                    typeof err.message === "string" &&
                    !err.message.toLowerCase().includes("email")
                ) {
                    message = err.message;
                }
                triggerPinError(message);
            }
        },
        [pin, rememberMe, loginWithPin, router, t],
    );

    const handleSelectTenantMatch = async (match: PinTenantMatch) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("terminal_tenant_id", match.tenantId);
            localStorage.setItem("terminal_tenant_name", match.tenantName);
            setConfiguredTenantName(match.tenantName);
        }
        setMultipleMatches(null);

        try {
            const session = await loginWithPin({
                pin: pendingPin || pin,
                tenantSlug: match.tenantId,
                remember: rememberMe,
            }).unwrap();

            const role = mapRoleCodeToRole(
                session.context.roleCode,
                session.context.stationCode,
            );
            router.push(homePathForRole(role));
        } catch (err: unknown) {
            const message =
                (err as { message?: string })?.message || t("pinError");
            triggerPinError(message);
        }
    };

    const handleClearTerminal = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("terminal_tenant_id");
            localStorage.removeItem("terminal_tenant_name");
            localStorage.removeItem("tenant_slug");
            localStorage.removeItem("selected_tenant_id");
        }
        setConfiguredTenantName(null);
    };

    const handleKeypadPress = (digit: string) => {
        if (isPinLoading) return;
        if (pin.length < 6) {
            const nextPin = pin + digit;
            setPin(nextPin);
            if (error) setError("");
            // Auto submit if 4 digits entered
            if (nextPin.length === 4) {
                void handlePinSubmit(nextPin);
            }
        }
    };

    const handleBackspace = () => {
        if (isPinLoading) return;
        setPin(prev => prev.slice(0, -1));
        if (error) setError("");
    };

    const handleClear = () => {
        if (isPinLoading) return;
        setPin("");
        if (error) setError("");
    };

    // Keyboard support for PIN entry
    useEffect(() => {
        if (mode !== "pin") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                handleKeypadPress(e.key);
            } else if (e.key === "Backspace") {
                e.preventDefault();
                handleBackspace();
            } else if (e.key === "Enter") {
                e.preventDefault();
                void handlePinSubmit();
            } else if (e.key === "Escape") {
                e.preventDefault();
                handleClear();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mode, pin, isPinLoading, handlePinSubmit]);

    async function handleCredentialsLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const value = identifier.trim();
        if (!value) {
            setError(t("credentialsError"));
            return;
        }
        if (!password.trim()) {
            setError(t("credentialsError"));
            return;
        }

        try {
            const session = await loginWithCredentials({
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
        } catch (err: unknown) {
            const message =
                err &&
                typeof err === "object" &&
                "message" in err &&
                typeof err.message === "string"
                    ? err.message
                    : t("credentialsError");
            setError(message);
        }
    }

    const maxPinDots = Math.max(4, pin.length);

    return (
        <div className="relative min-h-screen py-3 px-3 sm:px-4 flex flex-col justify-center items-center bg-[#fbfaf8] dark:bg-background select-none">
            {/* Top Bar with Brand & Locale Switcher */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-6 flex items-center gap-2">
                <div className="size-7 sm:size-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-[13px] shadow-sm shadow-primary/20">
                    F
                </div>
                <div className="hidden sm:block text-left leading-tight">
                    <span className="font-bold text-[13px] tracking-tight text-foreground block">
                        FANAYE
                    </span>
                    <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-gray">
                        POS
                    </span>
                </div>
            </div>

            <div className="absolute top-3 right-3 sm:top-4 sm:right-6">
                <LocaleSwitcher />
            </div>

            {/* Centered Compact Card Container */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] my-auto">
                {/* Header Text */}
                <div className="text-center mb-3">
                    <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-foreground">
                        {t("welcomeBack")}
                    </h1>
                    <p className="mt-0.5 text-[12px] text-slate-gray">
                        {t("subTitle")}
                    </p>
                </div>

                {/* Mode Segmented Tab Switcher */}
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-ivory/80 dark:bg-card border border-hairline p-1 mb-3 shadow-xs">
                    <button
                        type="button"
                        onClick={() => {
                            setMode("pin");
                            setError("");
                            setPin("");
                        }}
                        className={cn(
                            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[12px] font-semibold transition-all",
                            mode === "pin"
                                ? "bg-white dark:bg-accent text-foreground shadow-xs border border-hairline/60"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <KeyRound
                            className={cn(
                                "size-3.5",
                                mode === "pin" ? "text-primary" : "",
                            )}
                        />
                        <span>{t("staffPinTab")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode("credentials");
                            setError("");
                        }}
                        className={cn(
                            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[12px] font-semibold transition-all",
                            mode === "credentials"
                                ? "bg-white dark:bg-accent text-foreground shadow-xs border border-hairline/60"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <ShieldCheck
                            className={cn(
                                "size-3.5",
                                mode === "credentials" ? "text-primary" : "",
                            )}
                        />
                        <span>{t("managerTab")}</span>
                    </button>
                </div>

                {/* Main Auth Card */}
                <div className="rounded-[20px] border border-hairline bg-white dark:bg-card p-4 sm:p-5 shadow-lg shadow-black/[0.03]">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/95 dark:border-red-950 dark:bg-red-950/40 py-2 px-3 text-[12px] text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span className="leading-tight font-medium">
                                {error}
                            </span>
                        </div>
                    )}

                    {mode === "pin" ? (
                        /* STAFF PIN PAD INTERFACE */
                        <div className="space-y-3.5">
                            {/* PIN Dots Indicator */}
                            <div className="flex flex-col items-center justify-center pt-0.5">
                                <span className="text-[11px] font-semibold text-slate-gray uppercase tracking-wider mb-2">
                                    {t("enterPin")}
                                </span>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 py-1.5 px-3 rounded-xl bg-surface-ivory/50 dark:bg-secondary/30 transition-transform",
                                        shake && "animate-bounce text-red-500",
                                    )}
                                >
                                    {Array.from({
                                        length: Math.min(
                                            6,
                                            Math.max(4, maxPinDots),
                                        ),
                                    }).map((_, idx) => {
                                        const filled = idx < pin.length;
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "size-3 sm:size-3.5 rounded-full border-2 transition-all duration-150",
                                                    filled
                                                        ? "bg-primary border-primary scale-110 shadow-xs shadow-primary/40"
                                                        : "border-slate-300 dark:border-slate-700 bg-transparent",
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Keypad Buttons Grid */}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[280px] mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() =>
                                            handleKeypadPress(String(num))
                                        }
                                        disabled={isPinLoading}
                                        className="h-11 sm:h-12 rounded-[14px] border border-hairline bg-surface-ivory/60 dark:bg-secondary/40 text-[18px] sm:text-[19px] font-semibold text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary active:scale-95 transition-all flex items-center justify-center select-none shadow-2xs disabled:opacity-50"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    disabled={isPinLoading || pin.length === 0}
                                    className="h-11 sm:h-12 rounded-[14px] border border-hairline bg-surface-ivory/40 dark:bg-secondary/20 text-[12px] font-semibold text-slate-gray hover:text-foreground hover:bg-secondary active:scale-95 transition-all flex items-center justify-center select-none disabled:opacity-30"
                                >
                                    {t("clear")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleKeypadPress("0")}
                                    disabled={isPinLoading}
                                    className="h-11 sm:h-12 rounded-[14px] border border-hairline bg-surface-ivory/60 dark:bg-secondary/40 text-[18px] sm:text-[19px] font-semibold text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary active:scale-95 transition-all flex items-center justify-center select-none shadow-2xs disabled:opacity-50"
                                >
                                    0
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBackspace}
                                    disabled={isPinLoading || pin.length === 0}
                                    className="h-11 sm:h-12 rounded-[14px] border border-hairline bg-surface-ivory/40 dark:bg-secondary/20 text-slate-gray hover:text-foreground hover:bg-secondary active:scale-95 transition-all flex items-center justify-center select-none disabled:opacity-30"
                                    title={t("backspace")}
                                >
                                    <Delete className="size-4.5" />
                                </button>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="button"
                                onClick={() => void handlePinSubmit()}
                                disabled={isPinLoading || pin.length < 4}
                                className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {isPinLoading ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        <span>{t("signingIn")}</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <KeyRound className="size-3.5" />
                                        <span>{t("quickLogin")}</span>
                                    </span>
                                )}
                            </Button>
                        </div>
                    ) : (
                        /* MANAGER / ADMIN CREDENTIALS INTERFACE */
                        <form
                            onSubmit={handleCredentialsLogin}
                            className="space-y-3"
                        >
                            <div className="space-y-1">
                                <label className="text-[12px] font-medium text-foreground">
                                    {t("emailOrPhone")}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 size-3.5 text-slate-gray" />
                                    <Input
                                        type="text"
                                        value={identifier}
                                        onChange={e => {
                                            setIdentifier(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder={t("emailPlaceholder")}
                                        className="h-9 pl-9 rounded-[10px] text-[13px]"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-medium text-foreground">
                                        {t("password")}
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[11px] font-medium text-primary hover:underline"
                                    >
                                        {t("forgotPassword")}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 size-3.5 text-slate-gray" />
                                    <Input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={password}
                                        onChange={e => {
                                            setPassword(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder={t("passwordPlaceholder")}
                                        className="h-9 pl-9 pr-9 rounded-[10px] text-[13px]"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-2.5 text-slate-gray hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-3.5" />
                                        ) : (
                                            <Eye className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-[12px] text-slate-gray select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e =>
                                        setRememberMe(e.target.checked)
                                    }
                                    className="size-3.5 rounded border-hairline text-primary focus:ring-primary"
                                />
                                <span>{t("rememberMe")}</span>
                            </label>

                            <Button
                                type="submit"
                                disabled={isCredLoading}
                                className="mt-1 h-10 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold transition-all shadow-sm shadow-primary/20"
                            >
                                {isCredLoading ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        <span>{t("signingIn")}</span>
                                    </span>
                                ) : (
                                    t("signInBtn")
                                )}
                            </Button>
                        </form>
                    )}

                    {current && (
                        <div className="mt-3.5 pt-3 border-t border-hairline text-center">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(homePathForRole(current.role))
                                }
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline"
                            >
                                <UserCheck className="size-3.5 text-primary" />
                                <span>
                                    {t("resumeSession")}{" "}
                                    <strong>{current.name}</strong> (
                                    {current.role})
                                </span>
                                <ArrowRight className="size-3" />
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-4 text-center text-[12px] text-slate-gray">
                    {t("noAccount")}{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-primary hover:underline"
                    >
                        {t("signUpFree")}
                    </Link>
                </p>
            </div>

            {/* MULTI-TENANT DISAMBIGUATION MODAL */}
            {multipleMatches && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0"
                        onClick={() => setMultipleMatches(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[22px] border border-hairline bg-white dark:bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-3">
                            <div>
                                <h3 className="font-bold text-[16px] text-foreground">
                                    Select Restaurant
                                </h3>
                                <p className="text-[12px] text-slate-gray">
                                    Multiple accounts match PIN{" "}
                                    <strong className="font-mono tracking-wider">
                                        {pendingPin}
                                    </strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMultipleMatches(null)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                            {multipleMatches.map(match => (
                                <button
                                    key={`${match.tenantId}-${match.userId}`}
                                    type="button"
                                    onClick={() =>
                                        void handleSelectTenantMatch(match)
                                    }
                                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-hairline hover:border-primary hover:bg-secondary/40 transition-all group shadow-2xs"
                                >
                                    <div
                                        className={cn(
                                            "size-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 shadow-xs",
                                            getAvatarSolidColor(
                                                match.displayName,
                                            ),
                                        )}
                                    >
                                        {match.displayName
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-[13.5px] text-foreground truncate block">
                                                {match.tenantName}
                                            </span>
                                        </div>
                                        <span className="text-[12px] text-slate-gray block truncate">
                                            {match.displayName} (
                                            {match.role.replace("_", " ")})
                                        </span>
                                    </div>
                                    <ArrowRight className="size-4 text-slate-gray group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </button>
                            ))}
                        </div>

                        <p className="mt-3 text-center text-[11px] text-slate-gray leading-tight">
                            This device will remember your choice for instant
                            1-tap logins.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

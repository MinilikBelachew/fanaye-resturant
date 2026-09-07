"use client";

import { useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Phone,
    Shield,
    Sparkles,
    User,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { switchDemoStaff } from "@/context/slices/identitySlice";
import { homePathForRole } from "@/domains/identity/application/homePath";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import {
    DEMO_PASSWORD,
    DEMO_STAFF,
} from "@/domains/identity/infrastructure/demoStaff";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function GoogleIcon({ className = "size-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
        </svg>
    );
}

export default function SignInPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const current = useAppSelector(selectCurrentStaff);
    const staffMembers = useAppSelector(
        state => state.identity.staffMembers ?? DEMO_STAFF,
    );

    // Form states
    const [loginMethod, setLoginMethod] = useState<"credentials" | "quick_staff">("credentials");
    const [identifier, setIdentifier] = useState("karim@fanaye.et");
    const [password, setPassword] = useState(DEMO_PASSWORD);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [selectedStaffId, setSelectedStaffId] = useState(staffMembers[4]?.id ?? staffMembers[0]?.id);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [error, setError] = useState("");

    function handleCredentialsLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            if (!identifier.trim()) {
                setError("Please enter your email or phone number.");
                return;
            }
            if (password && password !== DEMO_PASSWORD && password !== "1234") {
                setError("Invalid password. (Use demo123 for all demo accounts)");
                return;
            }

            // Find staff by email/phone or fallback to selected/manager
            const matchedStaff =
                staffMembers.find(
                    s =>
                        s.email?.toLowerCase() === identifier.toLowerCase() ||
                        s.phone?.includes(identifier) ||
                        s.name.toLowerCase().includes(identifier.toLowerCase()),
                ) ?? staffMembers[4]; // Default to Karim (Waiter) or Manager

            if (matchedStaff) {
                dispatch(switchDemoStaff(matchedStaff.id));
                router.push(homePathForRole(matchedStaff.role));
            }
        }, 500);
    }

    function handleGoogleLogin() {
        setSocialLoading(true);
        setError("");
        setTimeout(() => {
            setSocialLoading(false);
            // Default Google login to Manager (Hana Tadesse) or Karim
            const manager = staffMembers.find(s => s.role === "manager") ?? staffMembers[0];
            if (manager) {
                dispatch(switchDemoStaff(manager.id));
                router.push(homePathForRole(manager.role));
            }
        }, 700);
    }

    function handleQuickStaffLogin(staffId: string) {
        const person = staffMembers.find(entry => entry.id === staffId);
        if (!person) return;
        dispatch(switchDemoStaff(person.id));
        router.push(homePathForRole(person.role));
    }

    return (
        <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#faf9f7] dark:bg-background">
            <div className="mx-auto w-full max-w-md my-auto">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                        Welcome back
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        Sign in to access your floor operations & station queues
                    </p>
                </div>

                {/* Auth Mode Toggle */}
                <div className="mt-6 flex rounded-[14px] border border-hairline bg-surface-ivory/60 p-1">
                    <button
                        type="button"
                        onClick={() => setLoginMethod("credentials")}
                        className={cn(
                            "flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition-all",
                            loginMethod === "credentials"
                                ? "bg-white text-foreground shadow-xs dark:bg-card"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        Email / Phone
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod("quick_staff")}
                        className={cn(
                            "flex-1 rounded-[10px] py-2 text-[13px] font-semibold transition-all",
                            loginMethod === "quick_staff"
                                ? "bg-white text-foreground shadow-xs dark:bg-card"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        Quick Staff Select
                    </button>
                </div>

                {/* Main Auth Card */}
                <div className="mt-4 rounded-[24px] border border-hairline bg-white p-6 sm:p-8 shadow-sm dark:bg-card">
                    {/* Mode 1: Standard Credentials & Google Login */}
                    {loginMethod === "credentials" ? (
                        <div>
                            {/* Google Social Login */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleLogin}
                                disabled={socialLoading}
                                className="h-11 w-full rounded-[14px] border-hairline bg-white hover:bg-secondary text-[14px] font-semibold gap-3 shadow-xs dark:bg-card"
                            >
                                <GoogleIcon />
                                <span>
                                    {socialLoading ? "Connecting Google..." : "Continue with Google"}
                                </span>
                            </Button>

                            <div className="relative my-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-hairline" />
                                </div>
                                <div className="relative flex justify-center text-[12px] uppercase">
                                    <span className="bg-white px-3 text-slate-gray dark:bg-card font-medium">
                                        or continue with credentials
                                    </span>
                                </div>
                            </div>

                            {/* Credentials Form */}
                            <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                {error && (
                                    <div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-foreground">
                                        Email or Phone Number
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                        <Input
                                            type="text"
                                            value={identifier}
                                            onChange={e => setIdentifier(e.target.value)}
                                            placeholder="name@fanaye.et or +251 91..."
                                            className="h-11 pl-10 rounded-[12px] text-[14px]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[13px] font-medium text-foreground">
                                            Password / PIN
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-[12px] font-medium text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="h-11 pl-10 pr-10 rounded-[12px] text-[14px]"
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

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-gray">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={e => setRememberMe(e.target.checked)}
                                            className="size-4 rounded border-hairline text-primary focus:ring-primary"
                                        />
                                        <span>Remember my device</span>
                                    </label>
                                    <span className="text-[12px] text-slate-gray">
                                        Demo: <span className="font-semibold text-foreground">demo123</span>
                                    </span>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold shadow-sm transition-all"
                                >
                                    {loading ? "Signing in..." : "Sign in to Dashboard"}
                                </Button>
                            </form>
                        </div>
                    ) : (
                        /* Mode 2: Quick Staff Member Switcher */
                        <div className="space-y-4">
                            <p className="text-[13px] text-slate-gray">
                                Select a staff role to instantly open their station view with preloaded demo operations:
                            </p>

                            <div className="space-y-2 max-h-[320px] overflow-y-auto app-scroll pr-1">
                                {staffMembers.map(person => {
                                    const isSelected = selectedStaffId === person.id;
                                    return (
                                        <button
                                            key={person.id}
                                            type="button"
                                            onClick={() => setSelectedStaffId(person.id)}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-[14px] border p-3 text-left transition-all",
                                                isSelected
                                                    ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/40"
                                                    : "border-hairline bg-surface-ivory/40 hover:bg-secondary text-slate-gray",
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-9 items-center justify-center rounded-full bg-secondary font-bold text-foreground text-[13px]">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-[14px]">
                                                        {person.name}
                                                    </p>
                                                    <p className="text-[12px] text-slate-gray">
                                                        {ROLE_LABELS[person.role]}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="size-3 stroke-[3]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <Button
                                type="button"
                                onClick={() => handleQuickStaffLogin(selectedStaffId)}
                                className="h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold shadow-sm transition-all"
                            >
                                Continue as {staffMembers.find(s => s.id === selectedStaffId)?.name}
                            </Button>
                        </div>
                    )}

                    {/* Active Session Fast Resume */}
                    {current && (
                        <div className="mt-4 pt-4 border-t border-hairline text-center">
                            <button
                                type="button"
                                onClick={() => router.push(homePathForRole(current.role))}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"
                            >
                                <span>Resume active session as {current.name}</span>
                                <ArrowRight className="size-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Link to Sign Up */}
                <p className="mt-6 text-center text-[14px] text-slate-gray">
                    Don&apos;t have a restaurant account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-semibold text-primary hover:underline"
                    >
                        Sign up for free
                    </Link>
                </p>
            </div>
        </div>
    );
}

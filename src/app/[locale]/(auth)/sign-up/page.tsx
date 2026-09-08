"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Phone,
    Sparkles,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/theme/LocaleSwitcher";

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

export default function SignUpPage() {
    const t = useTranslations("auth.signUp");
    const router = useRouter();

    // Form states
    const [restaurantName, setRestaurantName] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [concept, setConcept] = useState("casual_dining");
    const [agreed, setAgreed] = useState(true);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!restaurantName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
            setError("Please fill out all required fields.");
            return;
        }

        if (!agreed) {
            setError("Please accept the Terms of Service to continue.");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                router.push("/sign-in");
            }, 1200);
        }, 800);
    }

    function handleGoogleSignUp() {
        setError("Google sign-up is not available yet. Use email and password.");
    }

    return (
        <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#faf9f7] dark:bg-background">
            {/* Top Bar with Locale Switcher */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
                <LocaleSwitcher />
            </div>

            <div className="mx-auto w-full max-w-lg my-auto">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                        {t("title")}
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {t("subTitle")}
                    </p>
                </div>

                {/* Sign-Up Card */}
                <div className="mt-6 rounded-[24px] border border-hairline bg-white p-6 sm:p-8 dark:bg-card">
                    {success ? (
                        <div className="py-8 text-center space-y-3">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
                                <CheckCircle2 className="size-8 stroke-[2.5]" />
                            </div>
                            <h2 className="text-[20px] font-bold text-foreground">
                                {t("successTitle")}
                            </h2>
                            <p className="text-[14px] text-slate-gray max-w-sm mx-auto">
                                {t("successDesc")}
                            </p>
                            <div className="pt-2">
                                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                                    <Sparkles className="size-4 animate-spin" />
                                    <span>{t("openingDashboard")}</span>
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Google Sign-Up */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignUp}
                                disabled={socialLoading}
                                className="h-11 w-full rounded-[14px] border-hairline bg-white hover:bg-secondary text-[14px] font-semibold gap-3 dark:bg-card"
                            >
                                <GoogleIcon />
                                <span>
                                    {socialLoading ? t("googleConnecting") : t("googleBtn")}
                                </span>
                            </Button>

                            <div className="relative my-5">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-hairline" />
                                </div>
                                <div className="relative flex justify-center text-[12px] uppercase">
                                    <span className="bg-white px-3 text-slate-gray dark:bg-card font-medium">
                                        {t("orEmail")}
                                    </span>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSignUp} className="space-y-4">
                                {error && (
                                    <div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
                                        <AlertCircle className="size-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-foreground">
                                        {t("restaurantName")} <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                        <Input
                                            type="text"
                                            value={restaurantName}
                                            onChange={e => setRestaurantName(e.target.value)}
                                            placeholder={t("restaurantPlaceholder")}
                                            className="h-11 pl-10 rounded-[12px] text-[14px]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-foreground">
                                            {t("fullName")} <span className="text-primary">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                            <Input
                                                type="text"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder={t("namePlaceholder")}
                                                className="h-11 pl-10 rounded-[12px] text-[14px]"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-medium text-foreground">
                                            {t("phone")}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                            <Input
                                                type="text"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder={t("phonePlaceholder")}
                                                className="h-11 pl-10 rounded-[12px] text-[14px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-foreground">
                                        {t("workEmail")} <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder={t("emailPlaceholder")}
                                            className="h-11 pl-10 rounded-[12px] text-[14px]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-foreground">
                                        {t("password")} <span className="text-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder={t("passwordPlaceholder")}
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

                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium text-foreground">
                                        {t("concept")}
                                    </label>
                                    <select
                                        value={concept}
                                        onChange={e => setConcept(e.target.value)}
                                        className="h-11 w-full rounded-[12px] border border-hairline bg-surface-ivory/50 px-3 text-[14px] text-foreground outline-none focus:border-primary"
                                    >
                                        <option value="casual_dining">{t("conceptCasual")}</option>
                                        <option value="cafe_bar">{t("conceptCafe")}</option>
                                        <option value="fast_casual">{t("conceptFastCasual")}</option>
                                        <option value="bakery">{t("conceptBakery")}</option>
                                        <option value="lounge">{t("conceptLounge")}</option>
                                    </select>
                                </div>

                                <div className="pt-1">
                                    <label className="flex items-start gap-2.5 cursor-pointer text-[13px] text-slate-gray">
                                        <input
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={e => setAgreed(e.target.checked)}
                                            className="mt-0.5 size-4 rounded border-hairline text-primary focus:ring-primary"
                                        />
                                        <span>
                                            {t("termsPrefix")} <a href="#" className="text-primary hover:underline">{t("termsLink")}</a> {t("termsAnd")} <a href="#" className="text-primary hover:underline">{t("privacyLink")}</a>
                                        </span>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold transition-all"
                                >
                                    {loading ? t("creating") : t("submitBtn")}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer Link */}
                <p className="mt-6 text-center text-[14px] text-slate-gray">
                    {t("alreadyAccount")}{" "}
                    <Link
                        href="/sign-in"
                        className="font-semibold text-primary hover:underline"
                    >
                        {t("signIn")}
                    </Link>
                </p>
            </div>
        </div>
    );
}

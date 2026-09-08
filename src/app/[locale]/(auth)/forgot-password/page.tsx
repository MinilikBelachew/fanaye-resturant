"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/theme/LocaleSwitcher";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth.forgotPassword");
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!identifier.trim()) {
            setError("Please enter your registered email or phone number.");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSent(true);
        }, 800);
    }

    return (
        <div className="relative min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center bg-[#faf9f7] dark:bg-background">
            {/* Top Bar with Locale Switcher */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
                <LocaleSwitcher />
            </div>

            <div className="mx-auto w-full max-w-md my-auto">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                        {t("title")}
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        {t("subTitle")}
                    </p>
                </div>

                {/* Main Card */}
                <div className="mt-6 rounded-[24px] border border-hairline bg-white p-6 sm:p-8 dark:bg-card">
                    {sent ? (
                        <div className="py-4 text-center space-y-4">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
                                <CheckCircle2 className="size-8 stroke-[2.5]" />
                            </div>
                            <h2 className="text-[20px] font-bold text-foreground">
                                {t("resetDispatched")}
                            </h2>
                            <p className="text-[14px] text-slate-gray leading-relaxed">
                                {t("sentDesc")}{" "}
                                <span className="font-semibold text-foreground">
                                    {identifier}
                                </span>
                                {t("checkInbox")}
                            </p>

                            <div className="pt-2 space-y-2">
                                <Button
                                    type="button"
                                    onClick={() => setSent(false)}
                                    variant="outline"
                                    className="w-full h-11 rounded-[14px] text-[14px] font-medium"
                                >
                                    {t("resendBtn")}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => router.push("/sign-in")}
                                    className="w-full h-11 rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold"
                                >
                                    {t("returnBtn")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        placeholder={t("placeholder")}
                                        className="h-11 pl-10 rounded-[12px] text-[14px]"
                                        required
                                    />
                                </div>
                                <p className="text-[12px] text-slate-gray">
                                    {t("helperText")}
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold transition-all"
                            >
                                {loading ? t("sending") : t("submitBtn")}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Back to Sign In Link */}
                <div className="mt-6 text-center">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-gray hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{t("backToSignIn")}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

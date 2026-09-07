"use client";

import { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Mail,
    Phone,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
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
            <div className="mx-auto w-full max-w-md my-auto">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-[32px] font-bold tracking-tight text-foreground">
                        Forgot your password?
                    </h1>
                    <p className="mt-1 text-[14px] text-slate-gray">
                        No worries, we&apos;ll send you password recovery instructions
                    </p>
                </div>

                {/* Main Card */}
                <div className="mt-6 rounded-[24px] border border-hairline bg-white p-6 sm:p-8 shadow-sm dark:bg-card">
                    {sent ? (
                        <div className="py-4 text-center space-y-4">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50">
                                <CheckCircle2 className="size-8 stroke-[2.5]" />
                            </div>
                            <h2 className="text-[20px] font-bold text-foreground">
                                Reset Link Dispatched!
                            </h2>
                            <p className="text-[14px] text-slate-gray leading-relaxed">
                                We sent instructions to{" "}
                                <span className="font-semibold text-foreground">
                                    {identifier}
                                </span>
                                . Please check your inbox or SMS messages.
                            </p>

                            <div className="pt-2 space-y-2">
                                <Button
                                    type="button"
                                    onClick={() => setSent(false)}
                                    variant="outline"
                                    className="w-full h-11 rounded-[14px] text-[14px] font-medium"
                                >
                                    Resend Reset Link
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => router.push("/sign-in")}
                                    className="w-full h-11 rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold"
                                >
                                    Return to Sign In
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
                                    Email or Phone Number
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 size-4 text-slate-gray" />
                                    <Input
                                        type="text"
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        placeholder="e.g. manager@restaurant.et or +251 91..."
                                        className="h-11 pl-10 rounded-[12px] text-[14px]"
                                        required
                                    />
                                </div>
                                <p className="text-[12px] text-slate-gray">
                                    Enter the email address or phone number you registered with.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-2 h-11 w-full rounded-[14px] bg-primary text-primary-foreground hover:bg-primary-deep text-[14px] font-semibold shadow-sm transition-all"
                            >
                                {loading ? "Sending reset instructions..." : "Send Reset Link"}
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
                        <span>Back to Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

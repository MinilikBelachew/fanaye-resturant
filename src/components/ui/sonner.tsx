"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
    const { resolved } = useTheme();

    return (
        <Sonner
            theme={resolved === "dark" ? "dark" : "light"}
            className="toaster group"
            position="top-right"
            closeButton
            icons={{
                success: (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ),
                error: (
                    <CircleAlert className="size-4 shrink-0 text-rose-600" />
                ),
                close: <X className="size-3.5" />,
            }}
            toastOptions={{
                classNames: {
                    toast: "!bg-white dark:!bg-card !text-foreground border border-hairline shadow-md rounded-xl gap-3",
                    title: "text-[13px] font-semibold text-foreground",
                    description: "text-[12px] text-slate-gray",
                    success: "!bg-white dark:!bg-card",
                    error: "!bg-white dark:!bg-card",
                    info: "!bg-white dark:!bg-card",
                    closeButton:
                        "!bg-white dark:!bg-card !border-hairline !text-slate-gray hover:!text-foreground !left-auto !right-1 !top-1",
                },
            }}
        />
    );
}

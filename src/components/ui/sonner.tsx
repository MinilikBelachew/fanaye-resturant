"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
    const { resolved } = useTheme();

    return (
        <Sonner
            theme={resolved === "dark" ? "dark" : "light"}
            className="toaster group"
            position="top-right"
            richColors
            closeButton
            toastOptions={{
                classNames: {
                    toast: "border-hairline bg-card text-foreground shadow-lg",
                    title: "text-[13px] font-semibold",
                    description: "text-[12px] text-slate-gray",
                },
            }}
        />
    );
}

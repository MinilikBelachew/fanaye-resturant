"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
    { code: "en", label: "English", short: "EN", flag: "EN" },
    { code: "am", label: "አማርኛ", short: "አማ", flag: "አማ" },
];

export function LocaleSwitcher({ className }: { className?: string }) {
    const currentLocale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleSwitch = (newLocale: string) => {
        if (newLocale === currentLocale) return;
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-xl border border-border/60 bg-secondary/40 p-0.5 text-xs",
                className,
            )}
        >
            {LOCALES.map(loc => {
                const isActive = currentLocale === loc.code;
                return (
                    <button
                        key={loc.code}
                        type="button"
                        onClick={() => handleSwitch(loc.code)}
                        className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-colors cursor-pointer text-[11px]",
                            isActive
                                ? "bg-card text-foreground border border-border/70"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        title={loc.label}
                    >
                        <span>{loc.short}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default function LocaleDropdown() {
    return <LocaleSwitcher />;
}

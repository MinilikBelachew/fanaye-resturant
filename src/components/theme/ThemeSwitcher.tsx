"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggleButton({ className }: { className?: string }) {
    const { resolved, setMode } = useTheme();
    const dark = resolved === "dark";
    return (
        <button
            type="button"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
                "flex size-8 items-center justify-center rounded-md text-slate-gray hover:bg-secondary hover:text-foreground",
                className,
            )}
            onClick={() => setMode(dark ? "light" : "dark")}
        >
            {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
    );
}

export default function ThemeSwitcher() {
    const { mode, setMode } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className="flex rounded-[10px] bg-secondary p-0.5"
        >
            {OPTIONS.map(option => {
                const Icon = option.icon;
                const active = mode === option.id;
                return (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => setMode(option.id)}
                        className={cn(
                            "flex h-7 flex-1 items-center justify-center rounded-[8px] transition-colors",
                            active
                                ? "bg-card text-foreground shadow-subtle"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="size-3.5" />
                    </button>
                );
            })}
        </div>
    );
}

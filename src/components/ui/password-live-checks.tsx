"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function passwordLiveChecks(password: string) {
    return [
        {
            id: "length",
            ok: password.length >= 8,
            label: "8+ characters",
        },
        {
            id: "letter",
            ok: /[A-Za-z]/.test(password),
            label: "A letter",
        },
        {
            id: "number",
            ok: /\d/.test(password),
            label: "A number",
        },
    ] as const;
}

export function PasswordLiveChecks({ value }: { value: string }) {
    const checks = passwordLiveChecks(value);
    return (
        <ul className="mt-1.5 space-y-0.5">
            {checks.map(check => (
                <li
                    key={check.id}
                    className={cn(
                        "flex items-center gap-1.5 text-[11px]",
                        check.ok ? "text-foreground" : "text-slate-gray",
                    )}
                >
                    <span
                        className={cn(
                            "flex size-3.5 items-center justify-center rounded-full border",
                            check.ok
                                ? "border-foreground bg-foreground text-background"
                                : "border-hairline",
                        )}
                    >
                        {check.ok ? (
                            <Check className="size-2.5 stroke-[3]" />
                        ) : null}
                    </span>
                    {check.label}
                </li>
            ))}
        </ul>
    );
}

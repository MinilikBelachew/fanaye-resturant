"use client";

import { useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import { cn } from "@/lib/utils";

export default function RoleSwitcher({
    compact = false,
}: {
    compact?: boolean;
}) {
    const current = useAppSelector(selectCurrentStaff);
    const tRoles = useTranslations("roleLabels");

    if (!current) return null;

    const roleKey = current.role.toLowerCase();
    const roleLabel = tRoles.has(roleKey)
        ? tRoles(roleKey)
        : (ROLE_LABELS[roleKey] ?? ROLE_LABELS[current.role] ?? current.role);

    const initials =
        current.name
            .split(" ")
            .map(n => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "FA";

    if (compact) {
        return (
            <div
                title={`${roleLabel} · ${current.name}`}
                className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-background text-[11px] font-semibold text-foreground"
            >
                <span>{initials}</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex w-full items-center gap-2.5 rounded-xl border border-border bg-background p-1.5 text-left",
            )}
        >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                {initials}
            </div>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">
                    {roleLabel}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                    {current.name}
                </span>
            </span>
        </div>
    );
}

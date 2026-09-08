"use client";

import { useAppSelector } from "@/context/hooks";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";

export default function RoleSwitcher({
    compact = false,
}: {
    compact?: boolean;
}) {
    const current = useAppSelector(selectCurrentStaff);
    const branchName = useAppSelector(
        state => state.identity.session?.branchName,
    );
    const roleCode = useAppSelector(state => state.identity.session?.roleCode);

    if (!current) return null;

    const initials = current.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "FA";

    if (compact) {
        return (
            <div
                title={`${current.name} · ${ROLE_LABELS[current.role]}`}
                className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-500 text-[12px] font-bold text-white shadow-xs"
            >
                <span>{initials}</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-secondary/40 p-2.5 transition-colors hover:bg-secondary/60">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-500 text-[12px] font-bold text-white shadow-xs">
                <span>{initials}</span>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                        {current.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        {ROLE_LABELS[current.role]}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    <span className="truncate">
                        {branchName
                            ? branchName
                            : roleCode === "PLATFORM_SUPER_ADMIN"
                              ? "Platform Network"
                              : "Active"}
                    </span>
                </div>
            </div>
        </div>
    );
}

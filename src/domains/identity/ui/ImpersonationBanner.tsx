"use client";

import { ArrowLeft, Eye, ShieldAlert } from "lucide-react";
import { useImpersonation } from "@/domains/identity/application/useImpersonation";
import { ROLE_LABELS } from "@/domains/identity/domain/role";
import { mapRoleCodeToRole } from "@/domains/identity/application/mapAuthToStaff";

export default function ImpersonationBanner() {
    const {
        isImpersonating,
        session,
        impersonation,
        isExiting,
        exitImpersonation,
    } = useImpersonation();

    if (!isImpersonating || !session) {
        return null;
    }

    const mappedRole = mapRoleCodeToRole(session.roleCode, session.stationCode);
    const roleLabel =
        ROLE_LABELS[mappedRole] || session.roleCode.replace(/_/g, " ");
    const restaurantLabel =
        session.tenantName ||
        impersonation?.tenantName ||
        session.branchName ||
        "Restaurant";

    return (
        <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs backdrop-blur-md dark:bg-amber-500/10">
            <div className="flex min-w-0 items-center gap-2 text-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                    <Eye className="size-3" />
                    Support Mode
                </span>
                <span className="truncate font-medium">
                    Viewing{" "}
                    <strong className="font-semibold">{restaurantLabel}</strong>
                    {session.branchName &&
                    session.branchName !== restaurantLabel
                        ? ` (${session.branchName})`
                        : ""}{" "}
                    as{" "}
                    <strong className="font-semibold">
                        {session.displayName}
                    </strong>{" "}
                    <span className="text-muted-foreground">({roleLabel})</span>
                </span>
            </div>

            <button
                type="button"
                onClick={exitImpersonation}
                disabled={isExiting}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
            >
                <ArrowLeft className="size-3" />
                <span>{isExiting ? "Restoring…" : "Exit to Super Admin"}</span>
            </button>
        </div>
    );
}

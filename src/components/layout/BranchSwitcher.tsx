"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useListBranchesQuery,
    useSwitchBranchMutation,
} from "@/context/services/branchesApi";
import { useAppDispatch, useAppSelector } from "@/context/hooks";
import { setSession } from "@/context/slices/identitySlice";
import { api } from "@/context/services";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export default function BranchSwitcher({
    compact = false,
}: {
    compact?: boolean;
}) {
    const t = useTranslations("owner");
    const dispatch = useAppDispatch();
    const session = useAppSelector(state => state.identity.session);
    const role = session?.roleCode;
    const [open, setOpen] = useState(false);
    const canUse =
        role === "OWNER_ADMIN" ||
        role === "MANAGER" ||
        role === "owner" ||
        role === "manager";

    const { data } = useListBranchesQuery(undefined, {
        skip: !canUse || !session?.tenantId,
    });
    const [switchBranch, { isLoading }] = useSwitchBranchMutation();

    if (!canUse || !session?.branchId) return null;

    const branches = data?.data ?? [];
    if (branches.length <= 1 && !open) {
        return compact ? null : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-secondary/40 px-2.5 py-1 text-[11px] text-slate-gray">
                <Building2 className="size-3" />
                <span className="max-w-[140px] truncate">
                    {session.branchName || t("currentBranch")}
                </span>
            </div>
        );
    }

    async function onSelect(branchId: string) {
        if (branchId === session?.branchId) {
            setOpen(false);
            return;
        }
        try {
            const context = await switchBranch({ branchId }).unwrap();
            dispatch(setSession(context));
            dispatch(api.util.resetApiState());
            setOpen(false);
            toast.success(t("branchSwitched"));
        } catch (err) {
            toast.fromUnknown(err, t("branchSwitchError"));
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                disabled={isLoading}
                onClick={() => setOpen(v => !v)}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary/70",
                    compact && "px-2",
                )}
            >
                <Building2 className="size-3 text-brand" />
                <span className="max-w-[140px] truncate">
                    {session.branchName || t("currentBranch")}
                </span>
                <ChevronDown className="size-3 text-slate-gray" />
            </button>
            {open ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default"
                        aria-label={t("closeBranchMenu")}
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-hairline bg-card shadow-lg">
                        <p className="border-b border-hairline px-3 py-2 text-[10px] font-medium tracking-wide text-slate-gray uppercase">
                            {t("switchBranch")}
                        </p>
                        <ul className="max-h-64 overflow-y-auto py-1">
                            {branches.map(branch => {
                                const active = branch.id === session.branchId;
                                return (
                                    <li key={branch.id}>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={() =>
                                                void onSelect(branch.id)
                                            }
                                            className={cn(
                                                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-secondary/60",
                                                active && "bg-brand/5",
                                            )}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">
                                                    {branch.name}
                                                </span>
                                                {branch.displayCode ? (
                                                    <span className="text-[10px] text-slate-gray">
                                                        {branch.displayCode}
                                                    </span>
                                                ) : null}
                                            </span>
                                            {active ? (
                                                <Check className="size-3.5 shrink-0 text-brand" />
                                            ) : null}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            ) : null}
        </div>
    );
}

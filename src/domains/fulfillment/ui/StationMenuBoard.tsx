"use client";

import { useMemo, useState } from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
import {
    useClearStationItemSoldOutMutation,
    useMarkStationItemSoldOutMutation,
    useSetStationItemLimitMutation,
    useStationMenuQuery,
} from "@/context/services/stationsApi";
import { useAppSelector } from "@/context/hooks";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { StationRole } from "@/domains/identity/domain/role";

export default function StationMenuBoard({ role }: { role: StationRole }) {
    const stationId = useAppSelector(
        state => state.identity.session?.stationId,
    );
    const { data, isLoading, isError, refetch } = useStationMenuQuery(
        stationId ?? "",
        { skip: !stationId, pollingInterval: 15000 },
    );
    const [markSoldOut, marking] = useMarkStationItemSoldOutMutation();
    const [clearSoldOut, clearing] = useClearStationItemSoldOutMutation();
    const [setLimit, limiting] = useSetStationItemLimitMutation();
    const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});

    const items = data?.data ?? [];
    const busy = marking.isLoading || clearing.isLoading || limiting.isLoading;

    const counts = useMemo(() => {
        const soldOut = items.filter(item => item.soldOut).length;
        const limited = items.filter(
            item => !item.soldOut && item.remainingQty != null,
        ).length;
        return { soldOut, limited, available: items.length - soldOut };
    }, [items]);

    async function onSoldOut(menuItemId: string, name: string) {
        if (!stationId) return;
        try {
            await markSoldOut({ stationId, menuItemId }).unwrap();
            toast.success("Marked sold out", name);
        } catch (err) {
            toast.fromUnknown(err, "Could not mark sold out.");
        }
    }

    async function onAvailable(menuItemId: string, name: string) {
        if (!stationId) return;
        try {
            await clearSoldOut({ stationId, menuItemId }).unwrap();
            toast.success("Available again", name);
        } catch (err) {
            toast.fromUnknown(err, "Could not make available.");
        }
    }

    async function onSetLimit(menuItemId: string, name: string) {
        if (!stationId) return;
        const raw = limitDrafts[menuItemId] ?? "";
        const remainingQty = Number(raw);
        if (!Number.isFinite(remainingQty) || remainingQty < 0) {
            toast.error("Enter a valid remaining quantity.");
            return;
        }
        try {
            await setLimit({ stationId, menuItemId, remainingQty }).unwrap();
            toast.success(
                remainingQty === 0
                    ? "Marked sold out"
                    : `Limit set · ${remainingQty} left`,
                name,
            );
            setLimitDrafts(s => ({ ...s, [menuItemId]: "" }));
        } catch (err) {
            toast.fromUnknown(err, "Could not set limit.");
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                title="Station menu"
                description={
                    data?.stationName
                        ? `${data.stationName} — mark sold out or set how many you can still prepare.`
                        : "Control what waiters can order from your station."
                }
            />

            {!stationId ? (
                <p className="rounded-2xl border border-hairline bg-card p-6 text-[13px] text-slate-gray">
                    No station is linked to this login.
                </p>
            ) : isLoading ? (
                <div className="flex items-center justify-center p-16 text-slate-gray">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-hairline bg-card p-6">
                    <p className="text-[13px] text-destructive">
                        Could not load station menu.
                    </p>
                    <Button
                        className="mt-3"
                        variant="outline"
                        onClick={() => void refetch()}
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-[12px]">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700">
                            Available {counts.available}
                        </span>
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700">
                            Limited {counts.limited}
                        </span>
                        <span className="rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
                            Sold out {counts.soldOut}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-hairline bg-card p-12 text-center text-slate-gray">
                            <UtensilsCrossed className="size-8 opacity-50" />
                            <p className="text-[14px] font-medium text-foreground">
                                No dishes on this station
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map(item => {
                                const limited =
                                    !item.soldOut && item.remainingQty != null;
                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            "rounded-2xl border border-hairline bg-card p-4 shadow-xs",
                                            item.soldOut &&
                                                "border-destructive/30 bg-destructive/5",
                                            limited &&
                                                "border-amber-400/40 bg-amber-50/40",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-[14px] font-semibold text-foreground">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-0.5 text-[12px] text-slate-gray">
                                                    {formatEtb(
                                                        Number(item.price),
                                                    )}
                                                    {item.categoryName
                                                        ? ` · ${item.categoryName}`
                                                        : ""}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                                    item.soldOut
                                                        ? "bg-destructive/15 text-destructive"
                                                        : limited
                                                          ? "bg-amber-500/15 text-amber-800"
                                                          : "bg-emerald-500/15 text-emerald-700",
                                                )}
                                            >
                                                {item.soldOut
                                                    ? "Sold out"
                                                    : limited
                                                      ? `${item.remainingQty} left`
                                                      : "Available"}
                                            </span>
                                        </div>

                                        {item.availabilityReason ? (
                                            <p className="mt-2 text-[11px] text-slate-gray">
                                                {item.availabilityReason}
                                            </p>
                                        ) : null}

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.soldOut ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy}
                                                    onClick={() =>
                                                        void onAvailable(
                                                            item.id,
                                                            item.name,
                                                        )
                                                    }
                                                >
                                                    Available again
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy}
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        void onSoldOut(
                                                            item.id,
                                                            item.name,
                                                        )
                                                    }
                                                >
                                                    Sold out
                                                </Button>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Limit (e.g. 5)"
                                                value={
                                                    limitDrafts[item.id] ?? ""
                                                }
                                                onChange={e =>
                                                    setLimitDrafts(s => ({
                                                        ...s,
                                                        [item.id]:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="h-8 w-28 text-[12px]"
                                            />
                                            <Button
                                                size="sm"
                                                disabled={busy}
                                                onClick={() =>
                                                    void onSetLimit(
                                                        item.id,
                                                        item.name,
                                                    )
                                                }
                                            >
                                                Set limit
                                            </Button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                    <p className="text-[11px] text-slate-gray">
                        Role context: {role}. Waiters are notified when you sell
                        out or set a limit.
                    </p>
                </div>
            )}
        </DashboardFrame>
    );
}

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    ArrowRight,
    ChefHat,
    Clock3,
    Phone,
    Plus,
    Receipt,
    Search,
    Wallet,
} from "lucide-react";
import {
    useDispatcherCallsQuery,
    useOpenCallPickupMutation,
} from "@/context/services/floorApi";
import { useAppSelector } from "@/context/hooks";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DispatcherCall } from "@/domains/floor/domain/floorApi";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function statusTone(column: string) {
    switch (column) {
        case "IN_KITCHEN":
            return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
        case "READY_TO_PAY":
            return "bg-sky-500/15 text-sky-800 dark:text-sky-200";
        case "PAID":
            return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
        default:
            return "bg-secondary text-slate-gray";
    }
}

function CallRow({
    call,
    t,
}: {
    call: DispatcherCall;
    t: (key: string, values?: any) => string;
}) {
    const statusLabel = (column: string) => {
        switch (column) {
            case "IN_KITCHEN":
                return t("statCooking");
            case "READY_TO_PAY":
                return t("statReadyPacked");
            case "PAID":
                return t("statDeliveredSettled");
            default:
                return t("tabActive");
        }
    };

    return (
        <Link
            href={`/dispatcher/calls/${call.tableSessionId}`}
            className="group flex items-center gap-3 rounded-2xl border border-hairline bg-card/90 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-sm"
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Phone className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold tracking-tight">
                        {call.customerName}
                    </p>
                    <span
                        className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            statusTone(call.boardColumn),
                        )}
                    >
                        {statusLabel(call.boardColumn)}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-slate-gray">
                    {call.customerPhone || t("noPhone")} · {call.slotName}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-gray">
                    {call.cookingItemCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                            <ChefHat className="size-3" />
                            {call.cookingItemCount} {t("statCooking")}
                        </span>
                    ) : null}
                    {call.readyItemCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                            {call.readyItemCount} {t("statReadyPacked")}
                        </span>
                    ) : null}
                    {call.hasBill ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-300">
                            <Receipt className="size-3" />
                            {t("billReady")}
                        </span>
                    ) : null}
                </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-slate-gray transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
    );
}

export default function DispatcherBoard() {
    const t = useTranslations("dispatcher");
    const router = useRouter();
    const clockedIn = Boolean(
        useAppSelector(state => state.identity.session?.shiftSessionId),
    );
    const pollMs = useRealtimePollMs(12_000);
    const { data, isLoading, isError, refetch } = useDispatcherCallsQuery(
        undefined,
        {
            pollingInterval: pollMs,
        },
    );
    const [openCall, { isLoading: opening }] = useOpenCallPickupMutation();

    const [tab, setTab] = useState<string>("ALL");
    const [query, setQuery] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const calls = data?.data ?? [];
    const counts = useMemo(() => {
        const next: Record<string, number> = { ALL: calls.length };
        for (const call of calls) {
            next[call.boardColumn] = (next[call.boardColumn] ?? 0) + 1;
        }
        return next;
    }, [calls]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return calls.filter(call => {
            if (tab !== "ALL" && call.boardColumn !== tab) return false;
            if (!q) return true;
            return (
                call.customerName.toLowerCase().includes(q) ||
                (call.customerPhone ?? "").toLowerCase().includes(q) ||
                call.slotName.toLowerCase().includes(q)
            );
        });
    }, [calls, query, tab]);

    async function onCreate() {
        const customerName = name.trim();
        if (!customerName) {
            toast.error(t("guestNameRequired"));
            return;
        }
        if (!clockedIn) {
            toast.error(t("clockInRequired"));
            return;
        }
        try {
            const session = await openCall({
                customerName,
                customerPhone: phone.trim() || undefined,
            }).unwrap();
            setName("");
            setPhone("");
            setSheetOpen(false);
            toast.success(t("callOpened"));
            router.push(`/dispatcher/calls/${session.tableSessionId}`);
        } catch (err) {
            toast.fromUnknown(err, t("couldNotOpenCall"));
        }
    }

    const tabsList = [
        { id: "ALL", label: t("tabAllToday") },
        { id: "OPEN", label: t("tabActive") },
        { id: "IN_KITCHEN", label: t("statCooking") },
        { id: "READY_TO_PAY", label: t("statReadyPacked") },
        { id: "PAID", label: t("statDeliveredSettled") },
    ];

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[12px] font-semibold tracking-[0.12em] text-emerald-700 uppercase dark:text-emerald-300">
                        {t("callPickup")}
                    </p>
                    <h1 className="mt-1 text-[28px] font-semibold tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="mt-1 max-w-xl text-[14px] text-slate-gray">
                        {t("subtitle")}
                    </p>
                </div>
                <Button
                    onClick={() => setSheetOpen(true)}
                    disabled={!clockedIn}
                    className="h-11 rounded-full px-5 shadow-sm"
                >
                    <Plus className="size-4" />
                    {t("newCall")}
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[
                    {
                        label: t("statActiveCalls"),
                        value: counts.OPEN ?? 0,
                        icon: Clock3,
                    },
                    {
                        label: t("statCooking"),
                        value: counts.IN_KITCHEN ?? 0,
                        icon: ChefHat,
                    },
                    {
                        label: t("statReadyPacked"),
                        value: counts.READY_TO_PAY ?? 0,
                        icon: Receipt,
                    },
                    {
                        label: t("statDeliveredSettled"),
                        value: counts.PAID ?? 0,
                        icon: Wallet,
                    },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-hairline bg-card/80 px-3 py-3"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-[12px] text-slate-gray">
                                    {stat.label}
                                </p>
                                <Icon className="size-3.5 text-slate-gray" />
                            </div>
                            <p className="mt-1 text-[22px] font-semibold tracking-tight">
                                {stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 gap-1 overflow-x-auto rounded-full border border-hairline bg-card/70 p-1">
                    {tabsList.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                "shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                                tab === item.id
                                    ? "bg-foreground text-background"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {item.label}
                            <span className="ml-1.5 opacity-70">
                                {counts[item.id] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-gray" />
                    <Input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="h-10 rounded-full pl-9"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="h-[84px] animate-pulse rounded-2xl bg-secondary/70"
                        />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-destructive-border bg-destructive-soft p-4 text-[13px]">
                    {t("couldNotLoadCalls")}{" "}
                    <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => refetch()}
                    >
                        {t("retry")}
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-hairline px-6 py-14 text-center">
                    <Phone className="mx-auto size-8 text-slate-gray" />
                    <p className="mt-3 text-[16px] font-semibold">
                        {t("noCallsHere")}
                    </p>
                    {clockedIn ? (
                        <Button
                            variant="outline"
                            className="mt-4 rounded-full"
                            onClick={() => setSheetOpen(true)}
                        >
                            <Plus className="size-4" />
                            {t("newCall")}
                        </Button>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map(call => (
                        <CallRow key={call.tableSessionId} call={call} t={t} />
                    ))}
                </div>
            )}

            {sheetOpen ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
                    <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl border border-hairline bg-card p-5 shadow-lg">
                        <p className="text-[17px] font-semibold tracking-tight">
                            {t("newCallOrder")}
                        </p>
                        <p className="mt-1 text-[13px] text-slate-gray">
                            {t("newCallSubtitle")}
                        </p>
                        <div className="mt-4 space-y-3">
                            <div>
                                <label className="mb-1.5 block text-[12px] font-medium text-slate-gray">
                                    {t("guestName")}
                                </label>
                                <Input
                                    autoFocus
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t("guestNamePlaceholder")}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") onCreate();
                                    }}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[12px] font-medium text-slate-gray">
                                    {t("phoneOptional")}
                                </label>
                                <Input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder={t("phonePlaceholder")}
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex gap-2">
                            <Button
                                className="flex-1 rounded-full"
                                disabled={opening}
                                onClick={onCreate}
                            >
                                {opening ? t("opening") : t("openAndTakeOrder")}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setSheetOpen(false)}
                            >
                                {t("cancel")}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

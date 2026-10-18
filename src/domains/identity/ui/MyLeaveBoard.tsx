"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useCancelMyLeaveMutation,
    useListMyLeaveQuery,
    useRequestMyLeaveMutation,
} from "@/context/services/hrApi";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import { getEthiopianDateDetails } from "@/lib/ethiopian-calendar";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

const HOURS_PER_DAY = 8;
const DISPLAY_KEY = "fanaye.leaveDisplayUnit";

type DisplayUnit = "days" | "hours";

function parseLocalDate(iso: string): Date | null {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function ethLabel(iso: string, isAmharic: boolean): string {
    const date = parseLocalDate(iso);
    if (!date) return "";
    const eth = getEthiopianDateDetails(date);
    return isAmharic ? eth.formattedAm : eth.formattedEn;
}

export default function MyLeaveBoard() {
    const t = useTranslations("staffHr");
    const locale = useLocale();
    const isAmharic = locale === "am";
    const pollMs = useRealtimePollMs(20_000);
    const { data, isLoading } = useListMyLeaveQuery(undefined, {
        pollingInterval: pollMs,
        refetchOnFocus: true,
    });
    const [requestLeave, requesting] = useRequestMyLeaveMutation();
    const [cancelLeave, cancelling] = useCancelMyLeaveMutation();

    const leaveTypes = data?.data.leaveTypes ?? [];
    const balances = data?.data.balances ?? [];
    const rows = data?.data.requests ?? [];
    const defaultId = data?.data.defaultLeaveTypeId ?? "";

    const [leaveTypeId, setLeaveTypeId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("days");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem(DISPLAY_KEY);
        if (saved === "hours" || saved === "days") setDisplayUnit(saved);
    }, []);

    useEffect(() => {
        if (!leaveTypeId && defaultId) setLeaveTypeId(defaultId);
        else if (!leaveTypeId && leaveTypes.length > 0 && leaveTypes[0]?.id) {
            setLeaveTypeId(leaveTypes[0].id);
        }
    }, [defaultId, leaveTypeId, leaveTypes]);

    function setUnit(unit: DisplayUnit) {
        setDisplayUnit(unit);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(DISPLAY_KEY, unit);
        }
    }

    const formatBalance = (days: number) => {
        if (displayUnit === "hours") {
            return `${Number((days * HOURS_PER_DAY).toFixed(1))} ${t("unitHours")}`;
        }
        return `${days} ${t("unitDays")}`;
    };

    const selectedType = useMemo(
        () => leaveTypes.find(x => x.id === leaveTypeId) ?? null,
        [leaveTypes, leaveTypeId],
    );

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!leaveTypeId || !startDate || !endDate) {
            toast.error(t("myLeaveIncomplete"));
            return;
        }
        try {
            await requestLeave({
                leaveTypeId,
                startDate,
                endDate,
                reason: reason.trim() || undefined,
            }).unwrap();
            toast.success(t("leaveCreated"));
            setReason("");
            setStartDate("");
            setEndDate("");
        } catch (err) {
            toast.fromUnknown(err, t("leaveCreateError"));
        }
    }

    async function onCancel(id: string) {
        try {
            await cancelLeave({ id }).unwrap();
            toast.success(t("leaveCancelled"));
        } catch (err) {
            toast.fromUnknown(err, t("leaveCancelError"));
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                compact
                title={t("myLeaveTitle")}
                description={t("myLeaveHint")}
            />

            <div className="mb-2 rounded-2xl border border-hairline bg-card px-4 py-3 text-[13px]">
                {balances.length === 0 ? (
                    <span className="text-slate-gray">{t("noBalances")}</span>
                ) : (
                    <ul className="space-y-1.5">
                        {balances.map(b => (
                            <li
                                key={b.leaveTypeId}
                                className="flex items-center justify-between gap-3"
                            >
                                <span className="text-slate-gray">
                                    {b.leaveTypeName}
                                    {b.defaultDays != null
                                        ? ` · ${t("entitlement")}: ${b.defaultDays}`
                                        : ""}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {b.tracksBalance
                                        ? formatBalance(b.balanceDays)
                                        : "—"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mb-4 flex items-center gap-2 text-[12px]">
                <span className="text-slate-gray">{t("displayAs")}</span>
                <button
                    type="button"
                    onClick={() => setUnit("days")}
                    className={`h-7 rounded-lg px-2.5 font-medium ${
                        displayUnit === "days"
                            ? "bg-brand text-white"
                            : "border border-hairline text-foreground"
                    }`}
                >
                    {t("unitDays")}
                </button>
                <button
                    type="button"
                    onClick={() => setUnit("hours")}
                    className={`h-7 rounded-lg px-2.5 font-medium ${
                        displayUnit === "hours"
                            ? "bg-brand text-white"
                            : "border border-hairline text-foreground"
                    }`}
                >
                    {t("unitHours")}
                </button>
                <span className="text-slate-gray">
                    ({t("hoursPerDayHint", { hours: HOURS_PER_DAY })})
                </span>
            </div>

            <form
                onSubmit={onCreate}
                className="mb-6 grid gap-3 rounded-2xl border border-hairline bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
            >
                <div className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("leaveType")}
                    </span>
                    <Select
                        value={leaveTypeId || undefined}
                        onValueChange={setLeaveTypeId}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-hairline text-[13px] shadow-none">
                            <SelectValue placeholder={t("pickLeaveType")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {leaveTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                    {type.isDefault
                                        ? ` (${t("defaultTag")})`
                                        : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedType && !selectedType.tracksBalance ? (
                        <p className="text-[11px] text-slate-gray">
                            {t("typeNoBalanceHint")}
                        </p>
                    ) : null}
                </div>
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("from")}
                    </span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                    />
                    {startDate ? (
                        <p className="text-[11px] text-slate-gray">
                            {t("ethiopianDate")}:{" "}
                            {ethLabel(startDate, isAmharic)}
                        </p>
                    ) : null}
                </label>
                <label className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("to")}
                    </span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                    />
                    {endDate ? (
                        <p className="text-[11px] text-slate-gray">
                            {t("ethiopianDate")}: {ethLabel(endDate, isAmharic)}
                        </p>
                    ) : null}
                </label>
                <button
                    type="submit"
                    disabled={requesting.isLoading}
                    className="h-10 self-end rounded-xl bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                    {requesting.isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        t("requestLeave")
                    )}
                </button>
                <label className="space-y-1 text-[12px] sm:col-span-2 lg:col-span-4">
                    <span className="font-medium text-slate-gray">
                        {t("reason")}
                    </span>
                    <input
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        placeholder={t("reasonPlaceholder")}
                    />
                </label>
            </form>

            <div className="overflow-hidden rounded-2xl border border-hairline">
                {isLoading ? (
                    <div className="flex justify-center py-12 text-slate-gray">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : rows.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[13px] text-slate-gray">
                        {t("leaveEmpty")}
                    </p>
                ) : (
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-surface-ivory text-slate-gray">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t("leaveType")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colDates")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colDays")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colStatus")}
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                    {t("colActions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="border-t border-hairline"
                                >
                                    <td className="px-4 py-3">
                                        {row.leaveType}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        <div>
                                            {row.startDate} → {row.endDate}
                                        </div>
                                        <div className="text-[11px] text-slate-gray">
                                            {ethLabel(row.startDate, isAmharic)}{" "}
                                            → {ethLabel(row.endDate, isAmharic)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {displayUnit === "hours"
                                            ? `${Number((row.days * HOURS_PER_DAY).toFixed(1))}h`
                                            : row.days}
                                    </td>
                                    <td className="px-4 py-3">
                                        {t(`leaveStatuses.${row.status}`)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {row.status === "PENDING" ? (
                                            <button
                                                type="button"
                                                disabled={cancelling.isLoading}
                                                onClick={() =>
                                                    void onCancel(row.id)
                                                }
                                                className="h-8 rounded-lg border border-hairline px-2.5 text-[12px] font-medium disabled:opacity-60"
                                            >
                                                {t("cancelLeave")}
                                            </button>
                                        ) : (
                                            <span className="text-[12px] text-slate-gray">
                                                {row.decisionNote || "—"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardFrame>
    );
}

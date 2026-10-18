"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { useListHrAttendanceQuery } from "@/context/services/hrApi";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function StaffAttendanceBoard({
    basePath = "/manager/staff",
}: {
    basePath?: string;
}) {
    const t = useTranslations("staffHr");
    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 13);
        return d.toISOString().slice(0, 10);
    });
    const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

    const { data, isLoading, isError } = useListHrAttendanceQuery({ from, to });
    const rows = data?.data ?? [];

    const totals = useMemo(() => {
        let hours = 0;
        let late = 0;
        for (const row of rows) {
            if (row.hoursWorked != null) hours += row.hoursWorked;
            if (row.lateByMinutes > 0) late += 1;
        }
        return { hours: Number(hours.toFixed(1)), late };
    }, [rows]);

    return (
        <DashboardFrame>
            <Link
                href={basePath}
                className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-slate-gray hover:text-foreground"
            >
                <ArrowLeft className="size-3.5" />
                {t("backToStaff")}
            </Link>
            <PageHeader
                compact
                title={t("attendanceTitle")}
                description={t("attendanceHint")}
            />

            <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                    {t("from")}
                    <input
                        type="date"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        className="h-9 rounded-xl border border-hairline bg-card px-2.5 text-[13px] text-foreground"
                    />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                    {t("to")}
                    <input
                        type="date"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        className="h-9 rounded-xl border border-hairline bg-card px-2.5 text-[13px] text-foreground"
                    />
                </label>
                <p className="pb-2 text-[12px] text-slate-gray">
                    {t("attendanceSummary", {
                        hours: totals.hours,
                        late: totals.late,
                    })}
                </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-hairline">
                {isLoading ? (
                    <div className="flex justify-center py-12 text-slate-gray">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : isError ? (
                    <p className="px-4 py-8 text-center text-[13px] text-slate-gray">
                        {t("attendanceError")}
                    </p>
                ) : rows.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[13px] text-slate-gray">
                        {t("attendanceEmpty")}
                    </p>
                ) : (
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-surface-ivory text-slate-gray">
                            <tr>
                                <th className="px-4 py-3 font-medium">
                                    {t("colDate")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colStaff")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colIn")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colOut")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colHours")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colLate")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    {t("colBranch")}
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
                                        {row.businessDate}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {row.staffName}
                                        {row.jobTitle ? (
                                            <span className="ml-1 text-[11px] font-normal text-slate-gray">
                                                · {row.jobTitle}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {new Date(
                                            row.clockInAt,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.clockOutAt
                                            ? new Date(
                                                  row.clockOutAt,
                                              ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "—"}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.hoursWorked ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {row.lateByMinutes > 0
                                            ? `${row.lateByMinutes}m`
                                            : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-gray">
                                        {row.branchName}
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

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
import { useListAdminStaffQuery } from "@/context/services/staffApi";
import {
    useCreateHrLeaveMutation,
    useCreateLeaveTypeMutation,
    useDecideHrLeaveMutation,
    useDeleteLeaveTypeMutation,
    useListHrLeaveQuery,
    useListLeaveTypesQuery,
    useUpdateLeaveTypeMutation,
} from "@/context/services/hrApi";
import { useRealtimePollMs } from "@/domains/notifications/application/useRealtimePollMs";
import { Link } from "@/i18n/navigation";
import { getEthiopianDateDetails } from "@/lib/ethiopian-calendar";
import { toast } from "@/lib/toast";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";

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

export default function StaffLeaveBoard({
    basePath = "/manager/staff",
}: {
    basePath?: string;
}) {
    const t = useTranslations("staffHr");
    const locale = useLocale();
    const isAmharic = locale === "am";
    const pollMs = useRealtimePollMs(20_000);
    const { data: leaveRes, isLoading } = useListHrLeaveQuery(undefined, {
        pollingInterval: pollMs,
        refetchOnFocus: true,
    });
    const { data: staffRes } = useListAdminStaffQuery();
    const { data: typesRes } = useListLeaveTypesQuery();
    const [createLeave, creating] = useCreateHrLeaveMutation();
    const [createType, creatingType] = useCreateLeaveTypeMutation();
    const [updateType, updatingType] = useUpdateLeaveTypeMutation();
    const [deleteType, deletingType] = useDeleteLeaveTypeMutation();
    const [decideLeave, deciding] = useDecideHrLeaveMutation();

    const allLeaveTypes = typesRes?.data ?? [];
    const leaveTypes = useMemo(
        () => allLeaveTypes.filter(x => x.isActive),
        [allLeaveTypes],
    );
    const defaultTypeId =
        leaveTypes.find(x => x.isDefault)?.id ?? leaveTypes[0]?.id ?? "";

    const [membershipId, setMembershipId] = useState("");
    const [leaveTypeId, setLeaveTypeId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [newTypeName, setNewTypeName] = useState("");
    const [newDefaultDays, setNewDefaultDays] = useState("0");
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDefaultDays, setEditDefaultDays] = useState("0");

    useEffect(() => {
        if (!leaveTypeId && defaultTypeId) setLeaveTypeId(defaultTypeId);
    }, [defaultTypeId, leaveTypeId]);

    const rows = useMemo(() => {
        const all = leaveRes?.data ?? [];
        if (statusFilter === "ALL") return all;
        return all.filter(r => r.status === statusFilter);
    }, [leaveRes?.data, statusFilter]);

    const staffOptions = staffRes?.data ?? [];

    async function onCreateType(e: React.FormEvent) {
        e.preventDefault();
        const name = newTypeName.trim();
        if (!name) {
            toast.error(t("leaveTypeNameRequired"));
            return;
        }
        const days = Number(newDefaultDays);
        try {
            await createType({
                name,
                defaultDays: Number.isFinite(days) ? days : 0,
                tracksBalance: true,
            }).unwrap();
            toast.success(t("leaveTypeCreated"));
            setNewTypeName("");
            setNewDefaultDays("0");
        } catch (err) {
            toast.fromUnknown(err, t("leaveTypeCreateError"));
        }
    }

    function startEdit(type: {
        id: string;
        name: string;
        defaultDays: number;
    }) {
        setEditingTypeId(type.id);
        setEditName(type.name);
        setEditDefaultDays(String(type.defaultDays ?? 0));
    }

    async function onSaveEdit() {
        if (!editingTypeId) return;
        const name = editName.trim();
        if (!name) {
            toast.error(t("leaveTypeNameRequired"));
            return;
        }
        const days = Number(editDefaultDays);
        try {
            await updateType({
                id: editingTypeId,
                name,
                defaultDays: Number.isFinite(days) ? days : 0,
            }).unwrap();
            toast.success(t("leaveTypeUpdated"));
            setEditingTypeId(null);
        } catch (err) {
            toast.fromUnknown(err, t("leaveTypeUpdateError"));
        }
    }

    async function onDeleteType(id: string, name: string, isDefault: boolean) {
        if (isDefault) {
            toast.error(t("leaveTypeCannotDeleteDefault"));
            return;
        }
        if (!confirm(t("confirmDeleteLeaveType", { name }))) return;
        try {
            const res = await deleteType({ id }).unwrap();
            toast.success(
                res.deactivated
                    ? t("leaveTypeDeactivated")
                    : t("leaveTypeDeleted"),
            );
            if (editingTypeId === id) setEditingTypeId(null);
        } catch (err) {
            toast.fromUnknown(err, t("leaveTypeDeleteError"));
        }
    }

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!membershipId || !leaveTypeId || !startDate || !endDate) {
            toast.error(t("leaveIncomplete"));
            return;
        }
        try {
            await createLeave({
                membershipId,
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

    async function onDecide(id: string, status: "APPROVED" | "REJECTED") {
        try {
            await decideLeave({ id, status }).unwrap();
            toast.success(
                status === "APPROVED" ? t("leaveApproved") : t("leaveRejected"),
            );
        } catch (err) {
            toast.fromUnknown(err, t("leaveDecideError"));
        }
    }

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
                title={t("leaveTitle")}
                description={t("leaveHintCustom")}
            />

            <section className="mb-4 rounded-2xl border border-hairline bg-card p-4">
                <h3 className="mb-1 text-[13px] font-semibold text-foreground">
                    {t("leaveTypesTitle")}
                </h3>
                <p className="mb-3 text-[12px] text-slate-gray">
                    {t("leaveTypesHintGlobal")}
                </p>

                <div className="mb-4 overflow-hidden rounded-xl border border-hairline">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-surface-ivory text-slate-gray">
                            <tr>
                                <th className="px-3 py-2 font-medium">
                                    {t("leaveType")}
                                </th>
                                <th className="px-3 py-2 font-medium">
                                    {t("globalDays")}
                                </th>
                                <th className="px-3 py-2 font-medium text-right">
                                    {t("colActions")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {allLeaveTypes.map(type => (
                                <tr
                                    key={type.id}
                                    className="border-t border-hairline"
                                >
                                    <td className="px-3 py-2">
                                        {editingTypeId === type.id ? (
                                            <input
                                                value={editName}
                                                onChange={e =>
                                                    setEditName(e.target.value)
                                                }
                                                className="h-9 w-full max-w-[200px] rounded-lg border border-hairline bg-background px-2 text-[13px]"
                                            />
                                        ) : (
                                            <span className="font-medium">
                                                {type.name}
                                                {type.isDefault ? (
                                                    <span className="ml-1.5 text-[11px] text-brand">
                                                        ({t("defaultTag")})
                                                    </span>
                                                ) : null}
                                                {!type.isActive ? (
                                                    <span className="ml-1.5 text-[11px] text-slate-gray">
                                                        ({t("inactiveTag")})
                                                    </span>
                                                ) : null}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 tabular-nums">
                                        {editingTypeId === type.id ? (
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.5"
                                                value={editDefaultDays}
                                                onChange={e =>
                                                    setEditDefaultDays(
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 w-24 rounded-lg border border-hairline bg-background px-2 text-[13px]"
                                            />
                                        ) : (
                                            type.defaultDays
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {editingTypeId === type.id ? (
                                            <div className="inline-flex gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        updatingType.isLoading
                                                    }
                                                    onClick={() =>
                                                        void onSaveEdit()
                                                    }
                                                    className="h-8 rounded-lg bg-brand px-2.5 text-[12px] font-semibold text-white disabled:opacity-60"
                                                >
                                                    {t("saveLeaveType")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditingTypeId(null)
                                                    }
                                                    className="h-8 rounded-lg border border-hairline px-2.5 text-[12px]"
                                                >
                                                    {t("cancelEdit")}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="inline-flex gap-1">
                                                <button
                                                    type="button"
                                                    title={t("editLeaveType")}
                                                    onClick={() =>
                                                        startEdit(type)
                                                    }
                                                    className="flex size-8 items-center justify-center rounded-lg border border-hairline text-slate-gray hover:text-foreground"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                {!type.isDefault ? (
                                                    <button
                                                        type="button"
                                                        title={t(
                                                            "deleteLeaveType",
                                                        )}
                                                        disabled={
                                                            deletingType.isLoading
                                                        }
                                                        onClick={() =>
                                                            void onDeleteType(
                                                                type.id,
                                                                type.name,
                                                                type.isDefault,
                                                            )
                                                        }
                                                        className="flex size-8 items-center justify-center rounded-lg border border-hairline text-slate-gray hover:text-red-600 disabled:opacity-60"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <form
                    onSubmit={onCreateType}
                    className="flex flex-wrap items-end gap-2"
                >
                    <label className="min-w-[140px] flex-1 space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("newLeaveType")}
                        </span>
                        <input
                            value={newTypeName}
                            onChange={e => setNewTypeName(e.target.value)}
                            placeholder={t("newLeaveTypePlaceholder")}
                            className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        />
                    </label>
                    <label className="w-28 space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("globalDays")}
                        </span>
                        <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={newDefaultDays}
                            onChange={e => setNewDefaultDays(e.target.value)}
                            className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={creatingType.isLoading}
                        className="h-10 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                    >
                        {creatingType.isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            t("createLeaveType")
                        )}
                    </button>
                </form>
            </section>

            <form
                onSubmit={onCreate}
                className="grid gap-3 rounded-2xl border border-hairline bg-card p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
            >
                <div className="space-y-1 text-[12px]">
                    <span className="font-medium text-slate-gray">
                        {t("colStaff")}
                    </span>
                    <Select
                        value={membershipId || undefined}
                        onValueChange={setMembershipId}
                    >
                        <SelectTrigger className="h-10 w-full rounded-xl border-hairline text-[13px] shadow-none">
                            <SelectValue placeholder={t("pickStaff")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {staffOptions.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    disabled={creating.isLoading}
                    className="h-10 self-end rounded-xl bg-brand px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                    {creating.isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        t("createLeave")
                    )}
                </button>
                <label className="space-y-1 text-[12px] lg:col-span-5">
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

            <div className="mt-4 flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-40 rounded-xl border-hairline text-[13px] shadow-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                        <SelectItem value="PENDING">
                            {t("leaveStatuses.PENDING")}
                        </SelectItem>
                        <SelectItem value="APPROVED">
                            {t("leaveStatuses.APPROVED")}
                        </SelectItem>
                        <SelectItem value="REJECTED">
                            {t("leaveStatuses.REJECTED")}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-hairline">
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
                                    {t("colStaff")}
                                </th>
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
                                    <td className="px-4 py-3 font-medium">
                                        {row.staffName}
                                    </td>
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
                                        {row.days}
                                    </td>
                                    <td className="px-4 py-3">
                                        {t(`leaveStatuses.${row.status}`)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {row.status === "PENDING" ? (
                                            <div className="inline-flex gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        deciding.isLoading
                                                    }
                                                    onClick={() =>
                                                        void onDecide(
                                                            row.id,
                                                            "APPROVED",
                                                        )
                                                    }
                                                    className="h-8 rounded-lg bg-brand px-2.5 text-[12px] font-semibold text-white disabled:opacity-60"
                                                >
                                                    {t("approve")}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        deciding.isLoading
                                                    }
                                                    onClick={() =>
                                                        void onDecide(
                                                            row.id,
                                                            "REJECTED",
                                                        )
                                                    }
                                                    className="h-8 rounded-lg border border-hairline px-2.5 text-[12px] font-medium disabled:opacity-60"
                                                >
                                                    {t("reject")}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[12px] text-slate-gray">
                                                {row.decidedByName || "—"}
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

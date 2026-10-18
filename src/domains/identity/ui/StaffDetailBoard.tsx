"use client";

import { use, useEffect, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    Edit3,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    Phone,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/context/hooks";
import {
    useAdminStaffDetailQuery,
    useResetAdminStaffPasswordMutation,
    useResetAdminStaffPinMutation,
    useUpdateAdminStaffMutation,
} from "@/context/services/staffApi";
import {
    useListStaffLeaveBalancesQuery,
    useSetStaffLeaveOverridesMutation,
} from "@/context/services/hrApi";
import { useListStaffPayHistoryQuery } from "@/context/services/payrollApi";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatEtb } from "@/lib/money";
import { openEditStaff } from "@/context/slices/identitySlice";
import type { AdminStaffMember } from "@/domains/identity/domain/staffApi";
import type { Staff } from "@/domains/identity/domain/staff";
import type { Role } from "@/domains/identity/domain/role";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import AssignTablesSheet from "@/domains/identity/ui/AssignTablesSheet";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const AVATAR_SOLID_PALETTES = [
    "bg-emerald-600 text-white",
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-violet-600 text-white",
    "bg-teal-600 text-white",
    "bg-rose-600 text-white",
    "bg-cyan-700 text-white",
    "bg-amber-600 text-white",
    "bg-sky-600 text-white",
];

function getAvatarSolidColor(name: string): string {
    if (!name) return AVATAR_SOLID_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_SOLID_PALETTES[Math.abs(hash) % AVATAR_SOLID_PALETTES.length];
}

function mapRoleCode(code: string): Role {
    switch (code) {
        case "OWNER_ADMIN":
            return "owner";
        case "MANAGER":
            return "manager";
        case "CASHIER":
            return "cashier";
        case "WAITER":
            return "waiter";
        case "DISPATCHER":
            return "dispatcher";
        case "STATION_OPERATOR":
            return "kitchen";
        default:
            return "waiter";
    }
}

function toLegacyStaff(member: AdminStaffMember): Staff {
    return {
        id: member.id,
        name: member.name,
        role: mapRoleCode(member.roleCode),
        pinHint: member.hasPin ? "••••" : "",
        phone: member.phone ?? undefined,
        email: member.email ?? undefined,
        active: member.active,
        stationId: member.stationId ?? undefined,
        workingDays: member.workingDays?.length
            ? member.workingDays
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        assignedTableIds: member.shiftCoverages.flatMap(coverage =>
            coverage.tables.map(table => table.tableId),
        ),
    };
}

export default function StaffDetailBoard({
    params,
    basePath = "/manager/staff",
}: {
    params: Promise<{ membershipId: string }>;
    basePath?: string;
}) {
    const { membershipId } = use(params);
    const t = useTranslations("managerStaffDetail");
    const tStaff = useTranslations("managerStaff");
    const tCommon = useTranslations("common");
    const dispatch = useAppDispatch();

    const { data, isLoading, isError, refetch, isFetching } =
        useAdminStaffDetailQuery(membershipId);
    const member = data?.data;

    const [resetPin, { isLoading: resettingPin }] =
        useResetAdminStaffPinMutation();
    const [resetPassword, { isLoading: resettingPassword }] =
        useResetAdminStaffPasswordMutation();
    const [updateStaff, updatingStaff] = useUpdateAdminStaffMutation();

    const [pinOpen, setPinOpen] = useState(false);
    const [pinValue, setPinValue] = useState("");
    const [showPinValue, setShowPinValue] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [passwordValue, setPasswordValue] = useState("");
    const [showPasswordValue, setShowPasswordValue] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [hrForm, setHrForm] = useState({
        employeeCode: "",
        jobTitle: "",
        employmentType: "",
        payType: "",
        basePay: "",
        hireDate: "",
        probationEndDate: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        hrNotes: "",
    });
    const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>(
        {},
    );
    const { data: balancesRes } = useListStaffLeaveBalancesQuery(membershipId, {
        skip: !membershipId,
    });
    const { data: payHistoryRes } = useListStaffPayHistoryQuery(membershipId, {
        skip: !membershipId,
    });
    const [setLeaveOverrides] = useSetStaffLeaveOverridesMutation();

    useEffect(() => {
        if (!member) return;
        setHrForm({
            employeeCode: member.employeeCode ?? "",
            jobTitle: member.jobTitle ?? "",
            employmentType: member.employmentType ?? "",
            payType: member.payType ?? "",
            basePay: member.basePay != null ? String(member.basePay) : "",
            hireDate: member.hireDate ?? "",
            probationEndDate: member.probationEndDate ?? "",
            emergencyContactName: member.emergencyContactName ?? "",
            emergencyContactPhone: member.emergencyContactPhone ?? "",
            hrNotes: member.hrNotes ?? "",
        });
    }, [member]);

    useEffect(() => {
        const rows = balancesRes?.data ?? [];
        const next: Record<string, string> = {};
        for (const row of rows) {
            next[row.leaveTypeId] =
                row.overrideDays != null
                    ? String(row.overrideDays)
                    : String(row.defaultDays ?? 0);
        }
        setOverrideDraft(next);
    }, [balancesRes?.data]);

    async function onSaveHr(e: React.FormEvent) {
        e.preventDefault();
        if (!member) return;
        try {
            await updateStaff({
                membershipId: member.id,
                body: {
                    employeeCode: hrForm.employeeCode.trim() || undefined,
                    jobTitle: hrForm.jobTitle.trim() || undefined,
                    employmentType: hrForm.employmentType || undefined,
                    payType: hrForm.payType || undefined,
                    basePay:
                        hrForm.basePay !== ""
                            ? Number(hrForm.basePay)
                            : undefined,
                    hireDate: hrForm.hireDate || undefined,
                    probationEndDate: hrForm.probationEndDate || undefined,
                    emergencyContactName:
                        hrForm.emergencyContactName.trim() || undefined,
                    emergencyContactPhone:
                        hrForm.emergencyContactPhone.trim() || undefined,
                    hrNotes: hrForm.hrNotes.trim() || undefined,
                },
            }).unwrap();

            const balanceRows = balancesRes?.data ?? [];
            if (balanceRows.length > 0) {
                await setLeaveOverrides({
                    membershipId: member.id,
                    overrides: balanceRows.map(row => {
                        const raw = overrideDraft[row.leaveTypeId];
                        const n = Number(raw);
                        const defaultDays = row.defaultDays ?? 0;
                        // Same as default → clear override; otherwise store override
                        if (
                            raw === "" ||
                            !Number.isFinite(n) ||
                            n === defaultDays
                        ) {
                            return {
                                leaveTypeId: row.leaveTypeId,
                                entitlementDays: null,
                            };
                        }
                        return {
                            leaveTypeId: row.leaveTypeId,
                            entitlementDays: n,
                        };
                    }),
                }).unwrap();
            }

            toast.success(t("hrSaved"));
            void refetch();
        } catch (err) {
            toast.fromUnknown(err, t("hrSaveError"));
        }
    }

    async function onResetPin() {
        if (!member || !/^\d{4}$/.test(pinValue.trim())) {
            toast.error(tStaff("listPinValidationError"));
            return;
        }
        try {
            await resetPin({
                membershipId: member.id,
                pin: pinValue.trim(),
            }).unwrap();
            toast.success(tStaff("toastPinUpdated"));
            setPinOpen(false);
            setPinValue("");
            void refetch();
        } catch (err) {
            toast.fromUnknown(err, tStaff("toastPinUpdateError"));
        }
    }

    async function onResetPassword() {
        if (!member || passwordValue.trim().length < 6) {
            toast.error(tStaff("toastPasswordTooShort"));
            return;
        }
        try {
            await resetPassword({
                membershipId: member.id,
                password: passwordValue.trim(),
            }).unwrap();
            toast.success(tStaff("toastPasswordUpdated"));
            setPasswordOpen(false);
            setPasswordValue("");
            void refetch();
        } catch (err) {
            toast.fromUnknown(err, tStaff("toastPasswordError"));
        }
    }

    if (isLoading) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-hairline bg-card py-16">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="mt-2 text-[12px] text-slate-gray">
                        {t("loading")}
                    </p>
                </div>
            </DashboardFrame>
        );
    }

    if (isError || !member) {
        return (
            <DashboardFrame>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                    <p className="text-[13px] text-destructive">
                        {t("loadError")}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            asChild
                        >
                            <Link href={basePath}>
                                <ArrowLeft className="size-3.5" />
                                {t("backToStaff")}
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-8 rounded-full text-[12px]"
                            onClick={() => void refetch()}
                        >
                            {t("tryAgain")}
                        </Button>
                    </div>
                </div>
            </DashboardFrame>
        );
    }

    const isWaiter = member.roleCode === "WAITER";
    const tablesCount = member.tablesCoveredCount ?? 0;
    const shiftsCount = member.shiftsCoveredCount ?? 0;

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-3">
                <Link
                    href={basePath}
                    className="inline-flex w-fit items-center gap-1.5 text-[12px] text-slate-gray transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-3.5" />
                    {t("backToStaff")}
                </Link>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                "flex size-14 items-center justify-center rounded-2xl text-[20px] font-bold shadow-xs",
                                getAvatarSolidColor(member.name),
                            )}
                        >
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <PageHeader
                            compact
                            eyebrow={member.roleLabel}
                            title={member.name}
                            description={
                                member.email || member.phone || t("noContact")
                            }
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start">
                        {isFetching ? (
                            <RefreshHint label={t("updating")} />
                        ) : null}
                        <Badge
                            variant={member.active ? "success" : "secondary"}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-normal"
                        >
                            {member.active
                                ? tStaff("statusActive")
                                : tStaff("statusOff")}
                        </Badge>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            onClick={() =>
                                dispatch(openEditStaff(toLegacyStaff(member)))
                            }
                        >
                            <Edit3 className="size-3.5" />
                            {tCommon("edit")}
                        </Button>
                        {isWaiter ? (
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 rounded-full text-[12px]"
                                onClick={() => setAssignOpen(true)}
                            >
                                <UtensilsCrossed className="size-3.5" />
                                {tStaff("menuAssignTables")}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: t("statRole"),
                        value: member.roleLabel,
                    },
                    {
                        label: t("statStation"),
                        value: member.stationName || "—",
                    },
                    {
                        label: t("statShifts"),
                        value: String(shiftsCount),
                    },
                    {
                        label: t("statTables"),
                        value: String(tablesCount),
                    },
                ].map(stat => (
                    <div key={stat.label} className="bg-card px-4 py-3.5">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-gray">
                            {stat.label}
                        </p>
                        <p className="mt-1.5 text-[15px] font-medium tracking-tight text-foreground">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <form
                onSubmit={onSaveHr}
                className="space-y-3 rounded-2xl border border-hairline bg-card p-4"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-[14px] font-medium text-foreground">
                            {t("sectionHr")}
                        </h3>
                        <p className="text-[12px] text-slate-gray">
                            {t("sectionHrHint")}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="h-8 rounded-full text-[12px]"
                        disabled={updatingStaff.isLoading}
                    >
                        {updatingStaff.isLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : null}
                        {t("saveHr")}
                    </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <HrField
                        label={t("hrEmployeeCode")}
                        value={hrForm.employeeCode}
                        onChange={v =>
                            setHrForm(s => ({ ...s, employeeCode: v }))
                        }
                    />
                    <HrField
                        label={t("hrJobTitle")}
                        value={hrForm.jobTitle}
                        onChange={v => setHrForm(s => ({ ...s, jobTitle: v }))}
                    />
                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("hrEmploymentType")}
                        </span>
                        <Select
                            value={hrForm.employmentType || undefined}
                            onValueChange={v =>
                                setHrForm(s => ({ ...s, employmentType: v }))
                            }
                        >
                            <SelectTrigger className="h-10 w-full rounded-xl border-hairline text-[13px] shadow-none">
                                <SelectValue placeholder={t("hrPick")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {[
                                    "FULL_TIME",
                                    "PART_TIME",
                                    "CONTRACT",
                                    "CASUAL",
                                ].map(v => (
                                    <SelectItem key={v} value={v}>
                                        {t(`employmentTypes.${v}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("hrPayType")}
                        </span>
                        <Select
                            value={hrForm.payType || undefined}
                            onValueChange={v =>
                                setHrForm(s => ({ ...s, payType: v }))
                            }
                        >
                            <SelectTrigger className="h-10 w-full rounded-xl border-hairline text-[13px] shadow-none">
                                <SelectValue placeholder={t("hrPick")} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="SALARY">
                                    {t("payTypes.SALARY")}
                                </SelectItem>
                                <SelectItem value="HOURLY">
                                    {t("payTypes.HOURLY")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <HrField
                        label={t("hrBasePay")}
                        value={hrForm.basePay}
                        onChange={v => setHrForm(s => ({ ...s, basePay: v }))}
                        type="number"
                        hint={
                            hrForm.basePay
                                ? formatEtb(Number(hrForm.basePay) || 0)
                                : undefined
                        }
                    />
                    <HrField
                        label={t("hrHireDate")}
                        value={hrForm.hireDate}
                        onChange={v => setHrForm(s => ({ ...s, hireDate: v }))}
                        type="date"
                    />
                    <HrField
                        label={t("hrProbationEnd")}
                        value={hrForm.probationEndDate}
                        onChange={v =>
                            setHrForm(s => ({ ...s, probationEndDate: v }))
                        }
                        type="date"
                    />
                    <HrField
                        label={t("hrEmergencyName")}
                        value={hrForm.emergencyContactName}
                        onChange={v =>
                            setHrForm(s => ({
                                ...s,
                                emergencyContactName: v,
                            }))
                        }
                    />
                    <HrField
                        label={t("hrEmergencyPhone")}
                        value={hrForm.emergencyContactPhone}
                        onChange={v =>
                            setHrForm(s => ({
                                ...s,
                                emergencyContactPhone: v,
                            }))
                        }
                    />
                    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <p className="text-[12px] font-medium text-slate-gray">
                            {t("hrLeaveBalances")}
                        </p>
                        <p className="text-[11px] text-slate-gray">
                            {t("hrLeaveOverrideHint")}
                        </p>
                        <div className="overflow-hidden rounded-xl border border-hairline">
                            <table className="w-full text-left text-[12px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">
                                            {t("hrLeaveType")}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            {t("hrLeaveDefault")}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            {t("hrLeaveOverride")}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            {t("hrLeaveRemaining")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(balancesRes?.data ?? []).map(row => (
                                        <tr
                                            key={row.leaveTypeId}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-3 py-2 font-medium">
                                                {row.leaveTypeName}
                                            </td>
                                            <td className="px-3 py-2 tabular-nums">
                                                {row.defaultDays ?? 0}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.5"
                                                    value={
                                                        overrideDraft[
                                                            row.leaveTypeId
                                                        ] ??
                                                        String(
                                                            row.defaultDays ??
                                                                0,
                                                        )
                                                    }
                                                    onChange={e =>
                                                        setOverrideDraft(s => ({
                                                            ...s,
                                                            [row.leaveTypeId]:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    className="h-9 w-24 rounded-lg border border-hairline bg-background px-2 text-[13px]"
                                                />
                                            </td>
                                            <td className="px-3 py-2 tabular-nums">
                                                {row.balanceDays}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <label className="space-y-1 text-[12px] sm:col-span-2 lg:col-span-3">
                        <span className="font-medium text-slate-gray">
                            {t("hrNotes")}
                        </span>
                        <textarea
                            value={hrForm.hrNotes}
                            onChange={e =>
                                setHrForm(s => ({
                                    ...s,
                                    hrNotes: e.target.value,
                                }))
                            }
                            rows={2}
                            className="w-full rounded-xl border border-hairline bg-background px-3 py-2 text-[13px]"
                        />
                    </label>
                </div>
            </form>

            <section className="rounded-2xl border border-hairline bg-card p-4">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                    Pay history
                </h3>
                <p className="mt-1 text-[11px] text-slate-gray">
                    Paid amounts from Finance → Payroll (frozen after mark
                    paid).
                </p>
                {(payHistoryRes?.data?.length ?? 0) === 0 ? (
                    <p className="mt-3 text-[13px] text-muted-foreground">
                        No payments recorded yet.
                    </p>
                ) : (
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                            <thead className="text-slate-gray">
                                <tr>
                                    <th className="px-2 py-1.5 font-medium">
                                        Period
                                    </th>
                                    <th className="px-2 py-1.5 font-medium text-right">
                                        Base
                                    </th>
                                    <th className="px-2 py-1.5 font-medium text-right">
                                        OT
                                    </th>
                                    <th className="px-2 py-1.5 font-medium text-right">
                                        Net
                                    </th>
                                    <th className="px-2 py-1.5 font-medium">
                                        Method
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(payHistoryRes?.data ?? []).map(row => (
                                    <tr
                                        key={row.id}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-2 py-2">
                                            {row.runLabel ||
                                                `${row.periodStart} – ${row.periodEnd}`}
                                        </td>
                                        <td className="px-2 py-2 text-right tabular-nums">
                                            {formatEtb(row.baseGross)}
                                        </td>
                                        <td className="px-2 py-2 text-right tabular-nums">
                                            {row.otAmount > 0
                                                ? formatEtb(row.otAmount)
                                                : "—"}
                                        </td>
                                        <td className="px-2 py-2 text-right font-medium tabular-nums">
                                            {formatEtb(row.net)}
                                        </td>
                                        <td className="px-2 py-2 text-muted-foreground">
                                            {row.payMethod || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionContact")}
                    </h3>
                    <div className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-slate-gray" />
                            <span>{member.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="size-3.5 text-slate-gray" />
                            <span>{member.phone || "—"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 size-3.5 text-slate-gray" />
                            <div>
                                <p className="font-medium text-foreground">
                                    {t("workingDays")}
                                </p>
                                <p className="text-[12px] text-slate-gray">
                                    {member.dayShifts &&
                                    member.dayShifts.length > 0
                                        ? member.dayShifts
                                              .map(
                                                  row =>
                                                      `${row.dayCode} ${row.shiftName}`,
                                              )
                                              .join(" · ")
                                        : member.workingDays?.length
                                          ? member.workingDays.join(" · ")
                                          : t("noWorkingDays")}
                                </p>
                            </div>
                        </div>
                        {(member.joinedAt || member.createdAt) && (
                            <p className="pt-1 text-[11px] text-slate-gray">
                                {t("memberSince", {
                                    date: new Date(
                                        member.joinedAt || member.createdAt!,
                                    ).toLocaleDateString(),
                                })}
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-hairline bg-card p-4">
                    <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-slate-gray">
                        {t("sectionCredentials")}
                    </h3>
                    <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                            <div className="flex items-center gap-2 text-[13px]">
                                <KeyRound className="size-3.5 text-slate-gray" />
                                <span className="text-slate-gray">
                                    {tStaff("pinLabel")}
                                </span>
                                <span className="font-mono font-semibold tracking-widest">
                                    {member.hasPin
                                        ? "••••"
                                        : tStaff("credentialNone")}
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full text-[11px]"
                                onClick={() => {
                                    setPinOpen(true);
                                    setPinValue("");
                                    setShowPinValue(false);
                                }}
                            >
                                {tStaff("menuChangePin")}
                            </Button>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                            <div className="flex items-center gap-2 text-[13px]">
                                <Lock className="size-3.5 text-slate-gray" />
                                <span className="text-slate-gray">
                                    {tStaff("passwordLabel")}
                                </span>
                                <span
                                    className={cn(
                                        "font-medium",
                                        member.hasPassword
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-amber-600 dark:text-amber-400",
                                    )}
                                >
                                    {member.hasPassword
                                        ? tStaff("passwordSet")
                                        : tStaff("passwordNotSet")}
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 rounded-full text-[11px]"
                                onClick={() => {
                                    setPasswordOpen(true);
                                    setPasswordValue("");
                                    setShowPasswordValue(false);
                                }}
                            >
                                {tStaff("menuResetPassword")}
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-gray">
                            {t("credentialsHint")}
                        </p>
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-hairline bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="text-[14px] font-medium text-foreground">
                            {isWaiter
                                ? t("sectionCoverage")
                                : "Shift & Schedule"}
                        </h3>
                        <p className="text-[12px] text-slate-gray">
                            {isWaiter
                                ? t("coverageWaiterDesc")
                                : member.roleCode === "CASHIER"
                                  ? "Assigned shift rotation and register schedule."
                                  : t("coverageOtherDesc")}
                        </p>
                    </div>
                    {isWaiter ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-[12px]"
                            onClick={() => setAssignOpen(true)}
                        >
                            {tStaff("assignByShift")}
                        </Button>
                    ) : null}
                </div>

                {!isWaiter && member.roleCode !== "CASHIER" ? (
                    <p className="mt-4 text-[13px] text-slate-gray">
                        {member.stationName
                            ? t("stationAssigned", {
                                  name: member.stationName,
                              })
                            : t("noTableCoverage")}
                    </p>
                ) : member.shiftCoverages.length === 0 ? (
                    <p className="mt-4 text-[13px] text-slate-gray">
                        {tStaff("noShiftCoverage")}
                    </p>
                ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {member.shiftCoverages.map(coverage => (
                            <div
                                key={coverage.shiftDefinitionId}
                                className="rounded-xl border border-hairline px-3.5 py-3 bg-secondary/20"
                            >
                                <p className="text-[13px] font-semibold text-foreground">
                                    {coverage.shiftName}
                                </p>
                                <p className="text-[11px] text-slate-gray">
                                    {coverage.startLocalTime} –{" "}
                                    {coverage.endLocalTime}
                                </p>
                                {coverage.tables.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {coverage.tables.map(table => (
                                            <Link
                                                key={table.tableId}
                                                href={`/manager/tables`}
                                                className="rounded-md border border-hairline bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                            >
                                                {table.displayNumber ||
                                                    table.displayName}
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-[11px] text-slate-gray">
                                        {member.roleCode === "CASHIER"
                                            ? "Cash desk custody"
                                            : "Scheduled shift rotation"}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <AddEditStaffSheet />
            <AssignTablesSheet
                isOpen={assignOpen}
                waiterMembershipId={assignOpen ? member.id : null}
                waiterName={member.name}
                onClose={() => setAssignOpen(false)}
            />

            {pinOpen ? (
                <CredentialModal
                    title={tStaff("changeStaffPinTitle")}
                    subtitle={`${member.name} (${member.roleLabel})`}
                    value={pinValue}
                    onChange={v => setPinValue(v.replace(/\D/g, ""))}
                    show={showPinValue}
                    onToggleShow={() => setShowPinValue(v => !v)}
                    onClose={() => setPinOpen(false)}
                    onSubmit={() => void onResetPin()}
                    loading={resettingPin}
                    submitLabel={
                        resettingPin ? tStaff("saving") : tStaff("updatePin")
                    }
                    placeholder={tStaff("pinModalPlaceholder")}
                    inputMode="numeric"
                    maxLength={4}
                />
            ) : null}

            {passwordOpen ? (
                <CredentialModal
                    title={tStaff("menuResetPassword")}
                    subtitle={member.name}
                    value={passwordValue}
                    onChange={setPasswordValue}
                    show={showPasswordValue}
                    onToggleShow={() => setShowPasswordValue(v => !v)}
                    onClose={() => setPasswordOpen(false)}
                    onSubmit={() => void onResetPassword()}
                    loading={resettingPassword}
                    submitLabel={
                        resettingPassword
                            ? tStaff("saving")
                            : tStaff("updatePassword")
                    }
                    placeholder={tStaff("passwordModalPlaceholder")}
                />
            ) : null}
        </DashboardFrame>
    );
}

function HrField({
    label,
    value,
    onChange,
    type = "text",
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    hint?: string;
}) {
    return (
        <label className="space-y-1 text-[12px]">
            <span className="font-medium text-slate-gray">{label}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
            />
            {hint ? (
                <span className="text-[11px] text-slate-gray">{hint}</span>
            ) : null}
        </label>
    );
}

function RefreshHint({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-slate-gray">
            <Loader2 className="size-3 animate-spin" />
            {label}
        </span>
    );
}

function CredentialModal({
    title,
    subtitle,
    value,
    onChange,
    show,
    onToggleShow,
    onClose,
    onSubmit,
    loading,
    submitLabel,
    placeholder,
    inputMode,
    maxLength,
}: {
    title: string;
    subtitle: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    onClose: () => void;
    onSubmit: () => void;
    loading: boolean;
    submitLabel: string;
    placeholder: string;
    inputMode?: "numeric";
    maxLength?: number;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="fixed inset-0" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
                    <div>
                        <h3 className="text-[15px] font-semibold">{title}</h3>
                        <p className="text-[12px] text-slate-gray">
                            {subtitle}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-gray hover:bg-secondary"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="relative">
                    <Input
                        type={show ? "text" : "password"}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder}
                        inputMode={inputMode}
                        maxLength={maxLength}
                        className="h-10 pr-10 font-mono tracking-wider"
                    />
                    <button
                        type="button"
                        onClick={onToggleShow}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-gray hover:text-foreground"
                    >
                        {show ? (
                            <EyeOff className="size-4" />
                        ) : (
                            <Eye className="size-4" />
                        )}
                    </button>
                </div>
                <Button
                    type="button"
                    className="mt-4 h-10 w-full rounded-xl"
                    disabled={loading}
                    onClick={onSubmit}
                >
                    {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
}

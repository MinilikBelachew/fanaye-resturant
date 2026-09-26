"use client";

import { useMemo, useState } from "react";
import {
    Edit3,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    MoreVertical,
    Plus,
    Search,
    UserPlus,
    UtensilsCrossed,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppDispatch } from "@/context/hooks";
import { openAddStaff, openEditStaff } from "@/context/slices/identitySlice";
import {
    useAdminStaffQuery,
    useResetAdminStaffPasswordMutation,
    useResetAdminStaffPinMutation,
} from "@/context/services/staffApi";
import type { AdminStaffMember } from "@/domains/identity/domain/staffApi";
import type { Staff } from "@/domains/identity/domain/staff";
import type { Role } from "@/domains/identity/domain/role";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddEditStaffSheet from "@/domains/identity/ui/AddEditStaffSheet";
import AssignTablesSheet from "@/domains/identity/ui/AssignTablesSheet";
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
    const index = Math.abs(hash) % AVATAR_SOLID_PALETTES.length;
    return AVATAR_SOLID_PALETTES[index];
}

type FilterTab = "all" | "waiters" | "stations" | "management";

type StaffTabLabelKey =
    | "tabAllStaff"
    | "tabWaitersTables"
    | "tabStations"
    | "tabManagement";

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
        assignedTableIds: member.shiftCoverages.flatMap(coverage =>
            coverage.tables.map(table => table.tableId),
        ),
    };
}

export default function ManagerStaffPage() {
    const t = useTranslations("managerStaff");
    const tCommon = useTranslations("common");
    const dispatch = useAppDispatch();
    const { data, isLoading, isError, refetch } = useAdminStaffQuery();
    const liveStaff = data?.data ?? [];
    const shifts = data?.shifts ?? [];

    const [resetPin, { isLoading: resettingPin }] =
        useResetAdminStaffPinMutation();
    const [resetPassword, { isLoading: resettingPassword }] =
        useResetAdminStaffPasswordMutation();

    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [assignWaiterId, setAssignWaiterId] = useState<string | null>(null);
    const [assignWaiterName, setAssignWaiterName] = useState<string | null>(
        null,
    );

    // Modal state for PIN & Password resets
    const [pinTarget, setPinTarget] = useState<AdminStaffMember | null>(null);
    const [pinValue, setPinValue] = useState("");
    const [showPinValue, setShowPinValue] = useState(false);

    const [passwordTarget, setPasswordTarget] =
        useState<AdminStaffMember | null>(null);
    const [passwordValue, setPasswordValue] = useState("");
    const [showPasswordValue, setShowPasswordValue] = useState(false);

    const [menuOpenMemberId, setMenuOpenMemberId] = useState<string | null>(
        null,
    );

    const filteredStaff = useMemo(() => {
        return liveStaff.filter(member => {
            const role = mapRoleCode(member.roleCode);
            if (activeTab === "waiters" && role !== "waiter") return false;
            if (
                activeTab === "stations" &&
                member.roleCode !== "STATION_OPERATOR"
            ) {
                return false;
            }
            if (
                activeTab === "management" &&
                !["OWNER_ADMIN", "MANAGER", "CASHIER"].includes(member.roleCode)
            ) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const hay =
                    `${member.name} ${member.roleLabel} ${member.stationName ?? ""} ${member.phone ?? ""} ${member.email ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [liveStaff, activeTab, searchQuery]);

    const totalStaffCount = liveStaff.length;
    const waitersCount = liveStaff.filter(m => m.roleCode === "WAITER").length;
    const stationStaffCount = liveStaff.filter(
        m => m.roleCode === "STATION_OPERATOR",
    ).length;
    const allocatedTables = new Set(
        liveStaff.flatMap(member =>
            member.shiftCoverages.flatMap(coverage =>
                coverage.tables.map(table => table.tableId),
            ),
        ),
    ).size;

    function openAssign(member: AdminStaffMember) {
        setAssignWaiterId(member.id);
        setAssignWaiterName(member.name);
    }

    async function handleSavePin() {
        if (!pinTarget) return;
        if (!/^\d{4,6}$/.test(pinValue.trim())) {
            toast.error(t("listPinValidationError"));
            return;
        }

        try {
            await resetPin({
                membershipId: pinTarget.id,
                pin: pinValue.trim(),
            }).unwrap();

            toast.success(t("toastPinUpdated"), pinTarget.name);
            setPinTarget(null);
            setPinValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("toastPinUpdateError");
            toast.error(message);
        }
    }

    async function handleSavePassword() {
        if (!passwordTarget) return;
        if (passwordValue.trim().length < 6) {
            toast.error(t("toastPasswordTooShort"));
            return;
        }

        try {
            await resetPassword({
                membershipId: passwordTarget.id,
                password: passwordValue.trim(),
            }).unwrap();

            toast.success(t("toastPasswordUpdated"), passwordTarget.name);
            setPasswordTarget(null);
            setPasswordValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("toastPasswordError");
            toast.error(message);
        }
    }

    const filterTabs = useMemo((): Array<
        [FilterTab, StaffTabLabelKey, number]
    > => {
        return [
            ["all", "tabAllStaff", totalStaffCount],
            ["waiters", "tabWaitersTables", waitersCount],
            ["stations", "tabStations", stationStaffCount],
            [
                "management",
                "tabManagement",
                totalStaffCount - waitersCount - stationStaffCount,
            ],
        ];
    }, [totalStaffCount, waitersCount, stationStaffCount]);

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader
                    compact
                    eyebrow="House"
                    title="Staff"
                    description={t("pageDescription")}
                />
                <button
                    type="button"
                    onClick={() => dispatch(openAddStaff(undefined))}
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors sm:self-auto"
                >
                    <UserPlus className="size-4" />
                    {t("registerStaff")}
                </button>
            </div>

            {shifts.length > 0 ? (
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[12px] font-medium text-slate-gray">
                            {t("shiftsLabel")}
                        </p>
                        {shifts.map(shift => (
                            <span
                                key={shift.id}
                                className="rounded-full border border-hairline bg-secondary/50 px-2.5 py-1 text-[12px] font-medium"
                            >
                                {shift.name} · {shift.startLocalTime}–
                                {shift.endLocalTime}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("kpiTotal")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {totalStaffCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("kpiWaiters")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold text-brand">
                        {waitersCount}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-gray">
                        {t("tablesCovered", { count: allocatedTables })}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("kpiStations")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {stationStaffCount}
                    </p>
                </div>
                <div className="rounded-[16px] border border-hairline bg-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-gray">
                        {t("kpiShifts")}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold">
                        {shifts.length}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex rounded-[14px] border border-hairline bg-surface-ivory/50 p-1">
                    {filterTabs.map(([id, labelKey, count]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={cn(
                                "rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium transition-all",
                                activeTab === id
                                    ? "bg-white font-semibold shadow-xs dark:bg-card text-foreground"
                                    : "text-slate-gray hover:text-foreground",
                            )}
                        >
                            {t(labelKey)}{" "}
                            <span className="text-[11px] text-slate-gray">
                                ({count})
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute top-2.5 left-3 size-4 text-slate-gray" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9.5 rounded-[12px] bg-white pl-9 text-[13px] dark:bg-card"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-hairline bg-card">
                {isLoading ? (
                    <p className="px-6 py-10 text-center text-[13px] text-slate-gray">
                        {t("loadingStaff")}
                    </p>
                ) : isError ? (
                    <p className="px-6 py-10 text-center text-[13px] text-destructive">
                        {t("loadStaffError")}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[14px]">
                            <thead className="border-b border-hairline bg-secondary/30 text-[11px] font-medium tracking-wide text-slate-gray uppercase">
                                <tr>
                                    <th className="px-5 py-3">
                                        {t("colStaff")}
                                    </th>
                                    <th className="px-5 py-3">
                                        {t("colRole")}
                                    </th>
                                    <th className="px-5 py-3">
                                        {t("colCredentials")}
                                    </th>
                                    <th className="px-5 py-3">
                                        {t("colTablesByShift")}
                                    </th>
                                    <th className="px-5 py-3">
                                        {t("colStatus")}
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        {t("colActions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-hairline">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-slate-gray"
                                        >
                                            {t("emptyStaff")}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((member, idx) => {
                                        const isWaiter =
                                            member.roleCode === "WAITER";
                                        const isNearBottom =
                                            idx >= filteredStaff.length - 2 &&
                                            filteredStaff.length > 2;
                                        return (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-secondary/40 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "flex size-10 items-center justify-center rounded-full font-bold text-[14px] shrink-0 shadow-xs",
                                                                getAvatarSolidColor(
                                                                    member.name,
                                                                ),
                                                            )}
                                                        >
                                                            {member.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {member.name}
                                                            </p>
                                                            <p className="text-[12px] text-slate-gray">
                                                                {member.email ||
                                                                    member.phone ||
                                                                    t(
                                                                        "noContactInfo",
                                                                    )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium border",
                                                            isWaiter
                                                                ? "bg-primary/10 border-primary/20 text-primary"
                                                                : "bg-secondary text-foreground border-border/80",
                                                        )}
                                                    >
                                                        {member.roleLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 text-[11.5px]">
                                                        <div className="flex items-center gap-1.5 font-mono">
                                                            <KeyRound className="size-3 text-slate-gray" />
                                                            <span className="font-sans text-slate-gray">
                                                                {t("pinLabel")}
                                                            </span>
                                                            <span className="font-bold tracking-widest text-foreground">
                                                                {member.hasPin
                                                                    ? "••••"
                                                                    : t(
                                                                          "credentialNone",
                                                                      )}
                                                            </span>
                                                            {member.hasPin ? (
                                                                <button
                                                                    type="button"
                                                                    className="ml-0.5 text-slate-gray hover:text-foreground"
                                                                    title={t(
                                                                        "resetPinTooltip",
                                                                    )}
                                                                    onClick={() => {
                                                                        setPinTarget(
                                                                            member,
                                                                        );
                                                                        setPinValue(
                                                                            "",
                                                                        );
                                                                        setShowPinValue(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Lock className="size-3 text-slate-gray" />
                                                            <span className="text-slate-gray">
                                                                {t(
                                                                    "passwordLabel",
                                                                )}
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
                                                                    ? t(
                                                                          "passwordSet",
                                                                      )
                                                                    : t(
                                                                          "passwordNotSet",
                                                                      )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isWaiter ? (
                                                        <div className="max-w-md space-y-1.5">
                                                            {member
                                                                .shiftCoverages
                                                                .length ===
                                                            0 ? (
                                                                <span className="text-[12px] text-slate-gray italic">
                                                                    {t(
                                                                        "noShiftCoverage",
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                member.shiftCoverages.map(
                                                                    coverage => (
                                                                        <div
                                                                            key={
                                                                                coverage.shiftDefinitionId
                                                                            }
                                                                            className="text-[12px]"
                                                                        >
                                                                            <span className="font-semibold text-foreground">
                                                                                {
                                                                                    coverage.shiftName
                                                                                }{" "}
                                                                                (
                                                                                {
                                                                                    coverage.startLocalTime
                                                                                }

                                                                                –
                                                                                {
                                                                                    coverage.endLocalTime
                                                                                }
                                                                                ):
                                                                            </span>{" "}
                                                                            <span className="text-slate-gray">
                                                                                {coverage.tables
                                                                                    .map(
                                                                                        tbl =>
                                                                                            tbl.displayNumber ||
                                                                                            tbl.displayName,
                                                                                    )
                                                                                    .join(
                                                                                        ", ",
                                                                                    ) ||
                                                                                    "—"}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openAssign(
                                                                        member,
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                <Plus className="size-3" />
                                                                {t(
                                                                    "assignByShift",
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[12px] text-slate-gray">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant={
                                                            member.active
                                                                ? "success"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {member.active
                                                            ? t("statusActive")
                                                            : t("statusOff")}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="relative inline-block text-left">
                                                        {/* Three-dots menu trigger */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setMenuOpenMemberId(
                                                                    menuOpenMemberId ===
                                                                        member.id
                                                                        ? null
                                                                        : member.id,
                                                                );
                                                            }}
                                                            className={cn(
                                                                "size-8 p-0 rounded-lg text-slate-gray hover:text-foreground hover:bg-secondary transition-colors",
                                                                menuOpenMemberId ===
                                                                    member.id &&
                                                                    "bg-secondary text-foreground",
                                                            )}
                                                            title={t(
                                                                "staffOptions",
                                                            )}
                                                        >
                                                            <MoreVertical className="size-4" />
                                                        </Button>

                                                        {/* Dropdown Menu Popup */}
                                                        {menuOpenMemberId ===
                                                            member.id && (
                                                            <>
                                                                {/* Click outside backdrop */}
                                                                <div
                                                                    className="fixed inset-0 z-30"
                                                                    onClick={() =>
                                                                        setMenuOpenMemberId(
                                                                            null,
                                                                        )
                                                                    }
                                                                />

                                                                <div
                                                                    className={cn(
                                                                        "absolute right-0 z-40 w-48 rounded-xl border border-hairline bg-white dark:bg-card p-1 shadow-xl animate-in fade-in zoom-in-95",
                                                                        isNearBottom
                                                                            ? "bottom-full mb-1.5 origin-bottom-right"
                                                                            : "top-full mt-1.5 origin-top-right",
                                                                    )}
                                                                >
                                                                    {/* Change PIN Option */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            setPinTarget(
                                                                                member,
                                                                            );
                                                                            setPinValue(
                                                                                "",
                                                                            );
                                                                            setShowPinValue(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <KeyRound className="size-3.5 text-primary" />
                                                                        <span>
                                                                            {t(
                                                                                "menuChangePin",
                                                                            )}
                                                                        </span>
                                                                    </button>

                                                                    {/* Reset Password Option */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            setPasswordTarget(
                                                                                member,
                                                                            );
                                                                            setPasswordValue(
                                                                                "",
                                                                            );
                                                                            setShowPasswordValue(
                                                                                false,
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <Lock className="size-3.5 text-slate-gray" />
                                                                        <span>
                                                                            {t(
                                                                                "menuResetPassword",
                                                                            )}
                                                                        </span>
                                                                    </button>

                                                                    {/* Assign Tables Option (Waiters only) */}
                                                                    {isWaiter ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMenuOpenMemberId(
                                                                                    null,
                                                                                );
                                                                                openAssign(
                                                                                    member,
                                                                                );
                                                                            }}
                                                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                        >
                                                                            <UtensilsCrossed className="size-3.5 text-slate-gray" />
                                                                            <span>
                                                                                {t(
                                                                                    "menuAssignTables",
                                                                                )}
                                                                            </span>
                                                                        </button>
                                                                    ) : null}

                                                                    <div className="my-1 border-t border-hairline" />

                                                                    {/* Edit Staff Details */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setMenuOpenMemberId(
                                                                                null,
                                                                            );
                                                                            dispatch(
                                                                                openEditStaff(
                                                                                    toLegacyStaff(
                                                                                        member,
                                                                                    ),
                                                                                ),
                                                                            );
                                                                        }}
                                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground hover:bg-secondary/70 transition-colors"
                                                                    >
                                                                        <Edit3 className="size-3.5 text-slate-gray" />
                                                                        <span>
                                                                            {t(
                                                                                "menuEditStaff",
                                                                            )}
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* RESET PIN MODAL DIALOG */}
            {pinTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPinTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <KeyRound className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        {t("changeStaffPinTitle")}
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {pinTarget.name} ({pinTarget.roleLabel})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPinTarget(null)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-[13px]">
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("newNumericPin")}
                                </label>
                                <p className="text-[11.5px] text-slate-gray">
                                    {t("pinModalHint")}
                                </p>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showPinValue ? "text" : "password"
                                        }
                                        maxLength={4}
                                        autoComplete="new-password"
                                        value={pinValue}
                                        onChange={e =>
                                            setPinValue(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        placeholder={t("pinModalPlaceholder")}
                                        className="h-10 rounded-[10px] pr-10 font-mono tracking-wider text-[15px]"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPinValue(v => !v)}
                                        className="absolute right-3 top-2.5 z-10 flex size-5 cursor-pointer items-center justify-center text-slate-gray hover:text-foreground transition-colors"
                                        title={
                                            showPinValue
                                                ? t("hidePin")
                                                : t("showPin")
                                        }
                                    >
                                        {showPinValue ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPinTarget(null)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    {tCommon("cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        resettingPin || pinValue.length < 4
                                    }
                                    onClick={() => void handleSavePin()}
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold"
                                >
                                    {resettingPin
                                        ? t("saving")
                                        : t("updatePin")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL DIALOG */}
            {passwordTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPasswordTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border/60">
                                    <Lock className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        {t("resetWebPasswordTitle")}
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {passwordTarget.name} (
                                        {passwordTarget.roleLabel})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPasswordTarget(null)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 text-[13px]">
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("newPasswordLabel")}
                                </label>
                                <p className="text-[11.5px] text-slate-gray">
                                    {t("passwordModalHint")}
                                </p>
                                <div className="relative mt-1">
                                    <Input
                                        type={
                                            showPasswordValue
                                                ? "text"
                                                : "password"
                                        }
                                        value={passwordValue}
                                        onChange={e =>
                                            setPasswordValue(e.target.value)
                                        }
                                        placeholder={t(
                                            "passwordModalPlaceholder",
                                        )}
                                        className="h-10 rounded-[10px] pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPasswordValue(v => !v)
                                        }
                                        className="absolute right-3 top-2.5 z-10 flex size-5 cursor-pointer items-center justify-center text-slate-gray hover:text-foreground transition-colors"
                                        title={
                                            showPasswordValue
                                                ? t("hidePassword")
                                                : t("showPassword")
                                        }
                                    >
                                        {showPasswordValue ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPasswordTarget(null)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    {tCommon("cancel")}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={
                                        resettingPassword ||
                                        passwordValue.length < 6
                                    }
                                    onClick={() => void handleSavePassword()}
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-[13px] font-semibold"
                                >
                                    {resettingPassword
                                        ? t("saving")
                                        : t("updatePassword")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AddEditStaffSheet />
            <AssignTablesSheet
                isOpen={Boolean(assignWaiterId)}
                waiterMembershipId={assignWaiterId}
                waiterName={assignWaiterName}
                onClose={() => {
                    setAssignWaiterId(null);
                    setAssignWaiterName(null);
                }}
            />
        </DashboardFrame>
    );
}

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
    Building2,
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Plus,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import {
    useCreateSuperAdminStaffMutation,
    useGetSuperAdminStaffQuery,
    useGetSuperAdminTenantsQuery,
    useResetSuperAdminStaffPasswordMutation,
    useResetSuperAdminStaffPinMutation,
    useSuspendSuperAdminStaffMutation,
    type PlatformStaffMember,
} from "@/context/services/superAdminApi";
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

export function getAvatarSolidColor(name: string): string {
    if (!name) return AVATAR_SOLID_PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_SOLID_PALETTES.length;
    return AVATAR_SOLID_PALETTES[index];
}

function getRoleBadgeStyle(role: string) {
    return "bg-secondary text-foreground border-border/80 font-medium";
}

function formatLogin(value: string | null | undefined, neverLabel: string) {
    if (!value) return neverLabel;
    try {
        return new Date(value).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

export default function StaffDirectoryPage() {
    const t = useTranslations("superAdmin");
    const tCommon = useTranslations("common");
    const tTenancy = useTranslations("tenancy");

    const roleOptions = useMemo(
        () => [
            { value: "waiter", label: t("staff.roleWaiterServer") },
            { value: "cashier", label: t("staff.roleCashier") },
            { value: "manager", label: t("staff.roleFloorManager") },
            { value: "owner", label: t("staff.roleOwnerAdmin") },
            { value: "kitchen", label: t("staff.roleKitchenStation") },
            { value: "barista", label: t("staff.roleBaristaStation") },
            { value: "cakes", label: t("staff.roleCakesPastry") },
            { value: "soft_drinks", label: t("staff.roleSoftDrinks") },
        ],
        [t],
    );

    // Search, Pagination & Filter state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedTenantId, setSelectedTenantId] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");

    // Queries & Mutations
    const { data: tenantsData } = useGetSuperAdminTenantsQuery(undefined, {
        pollingInterval: 30_000,
    });
    const {
        data: staffData,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetSuperAdminStaffQuery(
        {
            page,
            limit: 15,
            search: search || undefined,
            tenantId: selectedTenantId || undefined,
            role: selectedRole || undefined,
            status: selectedStatus || undefined,
        },
        { pollingInterval: 20_000, refetchOnFocus: true },
    );

    const [createStaff, { isLoading: creatingStaff }] =
        useCreateSuperAdminStaffMutation();
    const [resetPin, { isLoading: resettingPin }] =
        useResetSuperAdminStaffPinMutation();
    const [resetPassword, { isLoading: resettingPassword }] =
        useResetSuperAdminStaffPasswordMutation();
    const [suspendStaff, { isLoading: suspending }] =
        useSuspendSuperAdminStaffMutation();

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [pinTarget, setPinTarget] = useState<PlatformStaffMember | null>(
        null,
    );
    const [passwordTarget, setPasswordTarget] =
        useState<PlatformStaffMember | null>(null);

    // Form states for modals
    const [newStaffTenantId, setNewStaffTenantId] = useState("");
    const [newStaffName, setNewStaffName] = useState("");
    const [newStaffRole, setNewStaffRole] = useState("waiter");
    const [newStaffPin, setNewStaffPin] = useState("1234");
    const [newStaffEmail, setNewStaffEmail] = useState("");
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [showNewStaffPin, setShowNewStaffPin] = useState(false);

    const [pinValue, setPinValue] = useState("");
    const [showPinValue, setShowPinValue] = useState(false);

    const [passwordValue, setPasswordValue] = useState("");
    const [showPasswordValue, setShowPasswordValue] = useState(false);

    const tenantsList = tenantsData?.data ?? [];
    const staffList = staffData?.data ?? [];
    const meta = staffData?.meta;

    // Handle Create Staff submission
    async function handleCreateStaff(e: React.FormEvent) {
        e.preventDefault();
        if (!newStaffTenantId) {
            toast.error(t("staff.toastSelectTenant"));
            return;
        }
        if (!newStaffName.trim()) {
            toast.error(t("staff.toastNameRequired"));
            return;
        }
        if (!/^\d{4,6}$/.test(newStaffPin.trim())) {
            toast.error(t("staff.toastPinInvalid"));
            return;
        }

        try {
            await createStaff({
                tenantId: newStaffTenantId,
                name: newStaffName.trim(),
                role: newStaffRole,
                pin: newStaffPin.trim(),
                email: newStaffEmail.trim() || undefined,
                phone: newStaffPhone.trim() || undefined,
            }).unwrap();

            toast.success(t("staff.toastStaffCreated"), newStaffName.trim());
            setIsCreateOpen(false);
            setNewStaffName("");
            setNewStaffPin("1234");
            setNewStaffEmail("");
            setNewStaffPhone("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("staff.toastCreateFailed");
            toast.error(message);
        }
    }

    // Handle Reset PIN submission
    async function handleSavePin() {
        if (!pinTarget) return;
        if (!/^\d{4,6}$/.test(pinValue.trim())) {
            toast.error(t("staff.toastPinInvalid"));
            return;
        }

        try {
            await resetPin({
                membershipId: pinTarget.membershipId,
                pin: pinValue.trim(),
            }).unwrap();

            toast.success(t("staff.toastPinUpdated"), pinTarget.displayName);
            setPinTarget(null);
            setPinValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("staff.toastPinUpdateFailed");
            toast.error(message);
        }
    }

    // Handle Reset Password submission
    async function handleSavePassword() {
        if (!passwordTarget) return;
        if (passwordValue.trim().length < 6) {
            toast.error(t("staff.toastPasswordMinLength"));
            return;
        }

        try {
            await resetPassword({
                membershipId: passwordTarget.membershipId,
                password: passwordValue.trim(),
            }).unwrap();

            toast.success(
                t("staff.toastPasswordUpdated"),
                passwordTarget.displayName,
            );
            setPasswordTarget(null);
            setPasswordValue("");
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("staff.toastPasswordResetFailed");
            toast.error(message);
        }
    }

    // Handle Suspend / Reactivate
    async function handleToggleSuspend(row: PlatformStaffMember) {
        const suspended =
            row.accountStatus !== "SUSPENDED" &&
            row.membershipStatus !== "INACTIVE";
        try {
            await suspendStaff({
                membershipId: row.membershipId,
                suspended,
            }).unwrap();

            toast.success(
                suspended
                    ? t("staff.toastUserSuspended")
                    : t("staff.toastUserReactivated"),
                row.displayName,
            );
            void refetch();
        } catch (err: unknown) {
            const message =
                (err as { data?: { message?: string } })?.data?.message ||
                t("staff.toastStatusUpdateFailed");
            toast.error(message);
        }
    }

    // DataTable Columns Definition
    const columns: DataTableColumn<PlatformStaffMember>[] = useMemo(
        () => [
            {
                id: "staff",
                header: t("staff.colStaffMember"),
                sortValue: row => row.displayName,
                cell: row => (
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "size-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 shadow-xs",
                                getAvatarSolidColor(row.displayName),
                            )}
                        >
                            {row.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="font-semibold text-[13.5px] text-foreground block leading-tight">
                                {row.displayName}
                            </span>
                            <span className="text-[11.5px] text-slate-gray">
                                {row.email ||
                                    row.phone ||
                                    t("staff.noContactInfo")}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                id: "tenant",
                header: t("staff.colRestaurantTenant"),
                sortValue: row => row.tenantName,
                cell: row => (
                    <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-slate-gray shrink-0" />
                        <span className="font-medium text-[13px] text-foreground">
                            {row.tenantName}
                        </span>
                    </div>
                ),
            },
            {
                id: "role",
                header: t("staff.colRole"),
                sortValue: row => row.roles[0] || "",
                cell: row => (
                    <div className="flex flex-wrap gap-1">
                        {row.roles.map(r => (
                            <span
                                key={r}
                                className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border",
                                    getRoleBadgeStyle(r),
                                )}
                            >
                                {r.replace("_", " ")}
                            </span>
                        ))}
                    </div>
                ),
            },
            {
                id: "pinStatus",
                header: t("staff.colPinStatus"),
                cell: row => (
                    <div className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground">
                        <span className="text-foreground font-bold text-[14px] tracking-widest">
                            ••••
                        </span>
                        <span className="text-[11.5px] text-muted-foreground font-sans">
                            {t("staff.pinActive")}
                        </span>
                    </div>
                ),
            },
            {
                id: "status",
                header: t("staff.colStatus"),
                sortValue: row => row.accountStatus,
                cell: row => {
                    const isSuspended =
                        row.accountStatus === "SUSPENDED" ||
                        row.membershipStatus === "INACTIVE";
                    return isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-2.5 py-0.5 text-[11.5px] font-medium text-red-700 dark:text-red-400">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            {tTenancy("suspended")}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-700 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {tTenancy("active")}
                        </span>
                    );
                },
            },
            {
                id: "lastLogin",
                header: t("staff.colLastLogin"),
                sortValue: row => row.lastLoginAt || "",
                cell: row => (
                    <span className="text-[12px] text-slate-gray">
                        {formatLogin(row.lastLoginAt, t("never"))}
                    </span>
                ),
            },
            {
                id: "actions",
                header: t("staff.colActions"),
                headerClassName: "text-right",
                className: "text-right",
                cell: row => {
                    const isSuspended =
                        row.accountStatus === "SUSPENDED" ||
                        row.membershipStatus === "INACTIVE";
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            {/* Change PIN Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPinTarget(row);
                                    setPinValue("");
                                }}
                                className="h-8 gap-1.5 px-2.5 rounded-lg text-[12px] border-hairline hover:border-primary/40 hover:text-primary"
                                title={t("staff.titleChangePin")}
                            >
                                <KeyRound className="size-3.5" />
                                <span>{t("staff.btnPin")}</span>
                            </Button>

                            {/* Reset Password Button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPasswordTarget(row);
                                    setPasswordValue("");
                                }}
                                className="h-8 gap-1.5 px-2.5 rounded-lg text-[12px] border-hairline hover:border-slate-400"
                                title={t("staff.titleResetWebPassword")}
                            >
                                <Lock className="size-3.5" />
                                <span className="hidden sm:inline">
                                    {t("staff.btnPassword")}
                                </span>
                            </Button>

                            {/* Suspend / Activate Button */}
                            <Button
                                type="button"
                                variant={isSuspended ? "default" : "outline"}
                                size="sm"
                                onClick={() => void handleToggleSuspend(row)}
                                className={cn(
                                    "h-8 gap-1.5 px-2.5 rounded-lg text-[12px]",
                                    isSuspended
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/40",
                                )}
                                title={
                                    isSuspended
                                        ? t("staff.titleReactivateStaff")
                                        : t("staff.titleSuspendStaff")
                                }
                            >
                                {isSuspended ? (
                                    <>
                                        <ShieldCheck className="size-3.5" />
                                        <span>{t("staff.btnActivate")}</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldOff className="size-3.5" />
                                        <span>{t("staff.btnSuspend")}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [t, tTenancy],
    );

    return (
        <DashboardFrame>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <PageHeader
                    eyebrow="Platform Management"
                    title="Staff Directory"
                    description="View, filter, manage PINs, and create staff accounts across all restaurant tenants."
                />

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching}
                        className="h-9 gap-1.5 rounded-xl border-hairline text-[13px]"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isFetching && "animate-spin",
                            )}
                        />
                        <span>{t("refresh")}</span>
                    </Button>

                    <Button
                        type="button"
                        onClick={() => {
                            if (tenantsList.length > 0 && !newStaffTenantId) {
                                setNewStaffTenantId(tenantsList[0].id);
                            }
                            setIsCreateOpen(true);
                        }}
                        className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold shadow-sm shadow-primary/20"
                    >
                        <UserPlus className="size-4" />
                        <span>{t("staff.createStaffUser")}</span>
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-400">
                    {t("staff.errorLoadDirectory")}
                </div>
            )}

            {/* Custom Filter Controls for DataTable */}
            <DataTable
                columns={columns}
                data={staffList}
                rowKey={row => row.membershipId}
                searchPlaceholder={t("staff.searchPlaceholder")}
                searchQuery={search}
                onSearchChange={val => {
                    setSearch(val);
                    setPage(1);
                }}
                serverSide={true}
                empty={
                    isLoading ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate-gray">
                            <span className="size-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                            <span>{t("staff.loadingStaff")}</span>
                        </div>
                    ) : (
                        t("staff.emptyNoMatches")
                    )
                }
                headerActions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tenant Dropdown */}
                        <select
                            value={selectedTenantId}
                            onChange={e => {
                                setSelectedTenantId(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-md border border-hairline bg-card px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">
                                {t("staff.filterAllTenants")}
                            </option>
                            {tenantsList.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>

                        {/* Role Dropdown */}
                        <select
                            value={selectedRole}
                            onChange={e => {
                                setSelectedRole(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-md border border-hairline bg-card px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">
                                {t("staff.filterAllRoles")}
                            </option>
                            <option value="WAITER">
                                {t("staff.filterWaiters")}
                            </option>
                            <option value="CASHIER">
                                {t("staff.filterCashiers")}
                            </option>
                            <option value="MANAGER">
                                {t("staff.filterManagers")}
                            </option>
                            <option value="OWNER_ADMIN">
                                {t("staff.filterOwnersAdmins")}
                            </option>
                            <option value="STATION_OPERATOR">
                                {t("staff.filterStationOperators")}
                            </option>
                        </select>

                        {/* Status Dropdown */}
                        <select
                            value={selectedStatus}
                            onChange={e => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-md border border-hairline bg-card px-2.5 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="">
                                {t("staff.filterAllStatuses")}
                            </option>
                            <option value="ACTIVE">{tTenancy("active")}</option>
                            <option value="SUSPENDED">
                                {tTenancy("suspended")}
                            </option>
                        </select>
                    </div>
                }
                pagination={
                    meta
                        ? {
                              page: meta.page,
                              totalPages: meta.totalPages,
                              total: meta.total,
                              onPageChange: p => setPage(p),
                          }
                        : undefined
                }
            />

            {/* CREATE STAFF MODAL DIALOG */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setIsCreateOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border/60">
                                    <UserPlus className="size-4" />
                                </div>
                                <h3 className="font-bold text-[16px] text-foreground">
                                    {t("staff.modalCreateTitle")}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateStaff}
                            className="space-y-3.5 text-[13px]"
                        >
                            {/* Target Tenant */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelRestaurantTenant")}{" "}
                                    <span className="text-primary">*</span>
                                </label>
                                <select
                                    value={newStaffTenantId}
                                    onChange={e =>
                                        setNewStaffTenantId(e.target.value)
                                    }
                                    required
                                    className="w-full h-10 rounded-[10px] border border-hairline bg-card px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="" disabled>
                                        {t("staff.selectRestaurant")}
                                    </option>
                                    {tenantsList.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Staff Name */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelFullName")}{" "}
                                    <span className="text-primary">*</span>
                                </label>
                                <Input
                                    value={newStaffName}
                                    onChange={e =>
                                        setNewStaffName(e.target.value)
                                    }
                                    placeholder={t("staff.placeholderFullName")}
                                    required
                                    className="h-10 rounded-[10px]"
                                />
                            </div>

                            {/* Role Picker */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelRole")}{" "}
                                    <span className="text-primary">*</span>
                                </label>
                                <select
                                    value={newStaffRole}
                                    onChange={e =>
                                        setNewStaffRole(e.target.value)
                                    }
                                    required
                                    className="w-full h-10 rounded-[10px] border border-hairline bg-card px-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                                >
                                    {roleOptions.map(opt => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* PIN with Eye Toggle */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelQuickAccessPin")}{" "}
                                    <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showNewStaffPin
                                                ? "text"
                                                : "password"
                                        }
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        autoComplete="new-password"
                                        value={newStaffPin}
                                        onChange={e =>
                                            setNewStaffPin(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    "",
                                                ),
                                            )
                                        }
                                        placeholder={t(
                                            "staff.placeholderPin4Digit",
                                        )}
                                        required
                                        className="h-10 rounded-[10px] pr-10 font-mono tracking-wider"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewStaffPin(v => !v)
                                        }
                                        className="absolute right-3 top-2.5 z-10 flex size-5 cursor-pointer items-center justify-center text-slate-gray hover:text-foreground transition-colors"
                                        title={
                                            showNewStaffPin
                                                ? t("hidePin")
                                                : t("showPin")
                                        }
                                    >
                                        {showNewStaffPin ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Email (Optional) */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelEmailAddress")}{" "}
                                    <span className="text-slate-gray font-normal">
                                        {t("optional")}
                                    </span>
                                </label>
                                <Input
                                    type="email"
                                    value={newStaffEmail}
                                    onChange={e =>
                                        setNewStaffEmail(e.target.value)
                                    }
                                    placeholder={t("staff.placeholderEmail")}
                                    className="h-10 rounded-[10px]"
                                />
                            </div>

                            {/* Phone (Optional) */}
                            <div className="space-y-1">
                                <label className="font-medium text-foreground">
                                    {t("staff.labelPhoneNumber")}{" "}
                                    <span className="text-slate-gray font-normal">
                                        {t("optional")}
                                    </span>
                                </label>
                                <Input
                                    type="tel"
                                    value={newStaffPhone}
                                    onChange={e =>
                                        setNewStaffPhone(e.target.value)
                                    }
                                    placeholder={t("staff.placeholderPhone")}
                                    className="h-10 rounded-[10px]"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="h-9 rounded-xl text-[13px]"
                                >
                                    {tCommon("cancel")}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creatingStaff}
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold"
                                >
                                    {creatingStaff
                                        ? t("creating")
                                        : t("staff.createStaff")}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHANGE PIN MODAL DIALOG */}
            {pinTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div
                        className="fixed inset-0"
                        onClick={() => setPinTarget(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-[20px] border border-hairline bg-white dark:bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-hairline pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border/60">
                                    <KeyRound className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-foreground">
                                        {t("staff.modalChangePinTitle")}
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {pinTarget.displayName} (
                                        {pinTarget.tenantName})
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
                                    {t("staff.labelNewNumericPin")}
                                </label>
                                <div className="relative">
                                    <Input
                                        type={
                                            showPinValue ? "text" : "password"
                                        }
                                        inputMode="numeric"
                                        pattern="[0-9]*"
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
                                        placeholder={t(
                                            "staff.placeholderEnterPin",
                                        )}
                                        className="h-10 rounded-[10px] pr-10 font-mono tracking-wider text-[15px]"
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
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold"
                                >
                                    {resettingPin
                                        ? t("saving")
                                        : t("staff.updatePin")}
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
                                        {t("staff.modalResetPasswordTitle")}
                                    </h3>
                                    <p className="text-[12px] text-slate-gray">
                                        {passwordTarget.displayName}
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
                                    {t("staff.labelNewPassword")}
                                </label>
                                <div className="relative">
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
                                            "staff.placeholderNewPassword",
                                        )}
                                        className="h-10 rounded-[10px] pr-10"
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
                                    className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary-deep text-[13px] font-semibold"
                                >
                                    {resettingPassword
                                        ? t("saving")
                                        : t("staff.updatePassword")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardFrame>
    );
}

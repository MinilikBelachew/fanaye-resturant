"use client";

import { useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    AlertTriangle,
    ArrowUpRight,
    Bot,
    Calendar,
    CheckCircle2,
    Clock,
    Database,
    Download,
    FileArchive,
    HardDriveDownload,
    Play,
    RefreshCw,
    Search,
    Send,
    Settings,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BackupInterval,
    useGetSuperAdminBackupOverviewQuery,
    useSendBackupToTenantTelegramMutation,
    useTriggerBackupAllTenantsMutation,
    useUpdateGlobalBackupSettingsMutation,
} from "@/context/services/backupApi";
import { useAppSelector } from "@/context/hooks";
import { API_BASE_URL } from "@/context/env";
import { cn } from "@/lib/utils";

export default function SuperAdminBackupsPage() {
    const accessToken = useAppSelector(state => state.identity.accessToken);
    const {
        data: overview,
        isLoading,
        refetch,
        isFetching,
    } = useGetSuperAdminBackupOverviewQuery();
    const [updateSettings, { isLoading: isUpdatingSettings }] =
        useUpdateGlobalBackupSettingsMutation();
    const [triggerAll, { isLoading: isTriggeringAll }] =
        useTriggerBackupAllTenantsMutation();
    const [sendToTenant, { isLoading: isSendingTenant }] =
        useSendBackupToTenantTelegramMutation();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInterval, setSelectedInterval] =
        useState<BackupInterval | null>(null);
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
    const [activeSendingTenantId, setActiveSendingTenantId] = useState<
        string | null
    >(null);
    const [isTriggerAllModalOpen, setIsTriggerAllModalOpen] = useState(false);
    const [operationMsg, setOperationMsg] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // Initial values from server overview
    const currentInterval =
        selectedInterval ?? overview?.globalSettings?.interval ?? "DAILY";
    const currentEnabled =
        isEnabled ?? overview?.globalSettings?.enabled ?? true;

    async function handleSaveSettings() {
        setOperationMsg(null);
        try {
            await updateSettings({
                interval: currentInterval,
                enabled: currentEnabled,
                sendHour: 0,
            }).unwrap();
            setOperationMsg({
                type: "success",
                text: "Global backup schedule and interval successfully saved!",
            });
            refetch();
        } catch (err: any) {
            setOperationMsg({
                type: "error",
                text: err?.data?.message || "Failed to update backup settings.",
            });
        }
    }

    async function handleTriggerAllConfirm() {
        setIsTriggerAllModalOpen(false);
        setOperationMsg(null);
        try {
            const res = await triggerAll().unwrap();
            setOperationMsg({
                type: "success",
                text: `Backup batch finished! Sent to ${res.sentCount} connected restaurant owners (${res.failedCount} failed).`,
            });
            refetch();
        } catch (err: any) {
            setOperationMsg({
                type: "error",
                text:
                    err?.data?.message ||
                    "Failed to trigger automated backups.",
            });
        }
    }

    async function handleSendSingle(tenantId: string, restaurantName: string) {
        setActiveSendingTenantId(tenantId);
        setOperationMsg(null);
        try {
            await sendToTenant(tenantId).unwrap();
            setOperationMsg({
                type: "success",
                text: `Successfully exported and sent latest backup archive to ${restaurantName}'s Telegram!`,
            });
            refetch();
        } catch (err: any) {
            setOperationMsg({
                type: "error",
                text:
                    err?.data?.message ||
                    `Failed to send backup for ${restaurantName}.`,
            });
        } finally {
            setActiveSendingTenantId(null);
        }
    }

    async function handleDownloadTenantBackup(
        tenantId: string,
        restaurantName: string,
    ) {
        try {
            const downloadUrl = `${API_BASE_URL}/backup/super-admin/export/${tenantId}`;
            const headers: Record<string, string> = {};
            if (accessToken) {
                headers["Authorization"] = `Bearer ${accessToken}`;
            }

            const res = await fetch(downloadUrl, {
                method: "GET",
                headers,
                credentials: "include",
            });

            if (!res.ok) {
                let errorMsg = `Export download failed (${res.status})`;
                try {
                    const json = await res.json();
                    if (json.message) errorMsg = json.message;
                } catch {
                    // ignore
                }
                throw new Error(errorMsg);
            }

            const disposition = res.headers.get("Content-Disposition");
            let filename = `${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_backup.sql.gz`;
            if (disposition && disposition.includes("filename=")) {
                filename = disposition
                    .split("filename=")[1]
                    .replace(/["']/g, "");
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setOperationMsg({
                type: "error",
                text: err?.message || "Failed to download tenant backup.",
            });
        }
    }

    const filteredTenants = (overview?.tenants || []).filter(
        t =>
            t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tenantId.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Platform Operations"
                title="Automated Restaurant Backups"
                description="Manage daily multi-tenant database archives, schedule Telegram deliveries, and verify tenant disaster recovery health."
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading || isFetching}
                        className="gap-2"
                    >
                        <RefreshCw
                            className={cn(
                                "h-4 w-4",
                                isFetching && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                }
            />

            {operationMsg && (
                <div
                    className={cn(
                        "mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm font-medium transition-all shadow-sm",
                        operationMsg.type === "success"
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
                            : "bg-red-50/80 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300",
                    )}
                >
                    {operationMsg.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                        <p>{operationMsg.text}</p>
                    </div>
                    <button
                        onClick={() => setOperationMsg(null)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
                <Card className="shadow-sm border">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                            Total Restaurants
                        </CardDescription>
                        <CardTitle className="text-3xl font-black">
                            {isLoading ? (
                                <RestorchSpinner className="h-6 w-6 text-muted-foreground" />
                            ) : (
                                (overview?.totalTenants ?? 0)
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Active platform tenant databases
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                            Telegram Linked
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {isLoading ? (
                                <RestorchSpinner className="h-6 w-6 text-muted-foreground" />
                            ) : (
                                `${overview?.linkedTenants ?? 0} / ${overview?.totalTenants ?? 0}`
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            {overview?.totalTenants
                                ? `${Math.round(((overview.linkedTenants || 0) / overview.totalTenants) * 100)}% coverage`
                                : "0% coverage"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                            Global Schedule
                        </CardDescription>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl font-bold">
                                {currentInterval === "DAILY"
                                    ? "Every Day"
                                    : currentInterval === "TWICE_DAILY"
                                      ? "Twice Daily"
                                      : currentInterval === "WEEKLY"
                                        ? "Weekly"
                                        : "Manual"}
                            </CardTitle>
                            <Badge
                                variant={
                                    currentEnabled ? "default" : "secondary"
                                }
                                className={cn(
                                    "text-[10px] font-semibold",
                                    currentEnabled
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                {currentEnabled ? "ACTIVE" : "PAUSED"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Automated cron runs at 00:00 EAT
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border bg-gradient-to-br from-primary/5 via-card to-card">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                            <Bot className="h-3.5 w-3.5 text-primary" />{" "}
                            Restorch Bot
                        </CardDescription>
                        <CardTitle className="text-lg font-bold truncate">
                            @{overview?.botUsername || "restorch_backup_bot"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={`https://t.me/${overview?.botUsername || "restorch_backup_bot"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            Open in Telegram{" "}
                            <ArrowUpRight className="h-3 w-3" />
                        </a>
                    </CardContent>
                </Card>
            </div>

            {/* Global Settings & Instant Trigger Card */}
            <Card className="mb-6 shadow-sm border">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Global Schedule & Automation Control
                            </CardTitle>
                            <CardDescription>
                                Set how frequently Restorch generates encrypted
                                gzip dumps and dispatches them to owner Telegram
                                chats.
                            </CardDescription>
                        </div>

                        <Button
                            onClick={() => setIsTriggerAllModalOpen(true)}
                            disabled={isTriggeringAll || isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 shadow-sm"
                        >
                            {isTriggeringAll ? (
                                <>
                                    <RestorchSpinner className="h-4 w-4 " />
                                    Exporting & Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Backup All Restaurants Now
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-2 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <Label
                                htmlFor="interval-select"
                                className="text-xs font-semibold"
                            >
                                Backup Frequency Interval
                            </Label>
                            <Select
                                value={currentInterval}
                                onValueChange={(val: BackupInterval) =>
                                    setSelectedInterval(val)
                                }
                            >
                                <SelectTrigger id="interval-select">
                                    <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DAILY">
                                        Daily at Midnight (00:00 EAT)
                                    </SelectItem>
                                    <SelectItem value="TWICE_DAILY">
                                        Twice Daily (12:00 PM & 00:00 Midnight)
                                    </SelectItem>
                                    <SelectItem value="WEEKLY">
                                        Weekly (Sundays at 00:00 EAT)
                                    </SelectItem>
                                    <SelectItem value="MANUAL">
                                        Manual Only (Disable Automated Cron)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="enabled-select"
                                className="text-xs font-semibold"
                            >
                                Scheduler Engine State
                            </Label>
                            <Select
                                value={currentEnabled ? "enabled" : "paused"}
                                onValueChange={val =>
                                    setIsEnabled(val === "enabled")
                                }
                            >
                                <SelectTrigger id="enabled-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="enabled">
                                        Enabled (Automated Dispatch Active)
                                    </SelectItem>
                                    <SelectItem value="paused">
                                        Paused (Do Not Auto-Send)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isUpdatingSettings || isLoading}
                                variant="secondary"
                                className="w-full gap-2"
                            >
                                {isUpdatingSettings ? (
                                    <>
                                        <RestorchSpinner className="h-4 w-4 " />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-4 w-4" />
                                        Save Schedule Settings
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tenant Backups Table */}
            <Card className="shadow-sm border">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Restaurant Data Vault
                            </CardTitle>
                            <CardDescription>
                                Individual tenant isolation status, last backup
                                archive, and manual override triggers.
                            </CardDescription>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search restaurant name..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                    <th className="py-3 px-4">Restaurant</th>
                                    <th className="py-3 px-4">Telegram Bot</th>
                                    <th className="py-3 px-4">Last Archive</th>
                                    <th className="py-3 px-4">Archive Size</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-muted-foreground"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <RestorchSpinner className="h-5 w-5 text-primary" />
                                                Loading restaurant backup
                                                catalog...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTenants.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-muted-foreground"
                                        >
                                            {searchQuery
                                                ? "No restaurants found matching your search."
                                                : "No restaurants registered yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map(tenant => (
                                        <tr
                                            key={tenant.tenantId}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-foreground">
                                                    {tenant.tenantName}
                                                </div>
                                                <div className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                                                    {tenant.tenantId}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {tenant.telegramLinked ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1.5"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {tenant.telegramUsername
                                                            ? `@${tenant.telegramUsername}`
                                                            : "Connected"}
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-muted-foreground gap-1.5"
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        Not Linked
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                                {tenant.lastBackupAt ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>
                                                            {new Date(
                                                                tenant.lastBackupAt,
                                                            ).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-muted-foreground/60">
                                                        Never backed up
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs">
                                                {tenant.lastBackupSizeKb ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <FileArchive className="h-3.5 w-3.5 text-primary" />
                                                        {
                                                            tenant.lastBackupSizeKb
                                                        }{" "}
                                                        KB
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {tenant.lastBackupStatus ===
                                                "SUCCESS" ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
                                                        Healthy
                                                    </Badge>
                                                ) : tenant.lastBackupStatus ===
                                                  "FAILED" ? (
                                                    <Badge
                                                        variant="danger"
                                                        className="gap-1"
                                                    >
                                                        <AlertTriangle className="h-3 w-3" />{" "}
                                                        Failed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSendSingle(
                                                                tenant.tenantId,
                                                                tenant.tenantName,
                                                            )
                                                        }
                                                        disabled={
                                                            !tenant.telegramLinked ||
                                                            activeSendingTenantId ===
                                                                tenant.tenantId
                                                        }
                                                        title={
                                                            tenant.telegramLinked
                                                                ? "Send backup archive directly to owner Telegram"
                                                                : "Owner has not connected Telegram yet"
                                                        }
                                                        className="gap-1.5 text-xs h-8"
                                                    >
                                                        {activeSendingTenantId ===
                                                        tenant.tenantId ? (
                                                            <RestorchSpinner className="h-3.5 w-3.5 " />
                                                        ) : (
                                                            <Send className="h-3.5 w-3.5 text-primary" />
                                                        )}
                                                        Send
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDownloadTenantBackup(
                                                                tenant.tenantId,
                                                                tenant.tenantName,
                                                            )
                                                        }
                                                        title="Download .sql.gz archive to browser"
                                                        className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        .sql.gz
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirm Trigger All Dialog */}
            <Dialog
                open={isTriggerAllModalOpen}
                onOpenChange={setIsTriggerAllModalOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Send className="size-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    Trigger All Automated Backups
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Instant dispatch to connected Telegram chats
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-2 py-2 text-xs text-foreground leading-relaxed">
                        <p>
                            Are you sure you want to export and dispatch the
                            latest database archives to{" "}
                            <b>
                                all {overview?.linkedTenants ?? 0} connected
                                restaurants
                            </b>{" "}
                            right now?
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                            Each tenant will receive exclusively their own 100%
                            isolated .sql.gz archive with zero data leaks.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTriggerAllModalOpen(false)}
                            disabled={isTriggeringAll}
                            className="rounded-xl text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleTriggerAllConfirm}
                            disabled={isTriggeringAll}
                            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 gap-1.5"
                        >
                            {isTriggeringAll ? (
                                <>
                                    <RestorchSpinner className="size-3.5 " />
                                    Dispatching Backups...
                                </>
                            ) : (
                                <>
                                    <Send className="size-3.5" />
                                    Confirm & Dispatch Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardFrame>
    );
}

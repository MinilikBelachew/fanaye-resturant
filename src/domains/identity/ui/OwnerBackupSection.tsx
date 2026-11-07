"use client";

import { useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Database,
    Download,
    Eye,
    FileArchive,
    FileCheck2,
    HardDriveDownload,
    HelpCircle,
    Info,
    Loader2,
    RefreshCw,
    Send,
    ShieldAlert,
    ShieldCheck,
    TableProperties,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BackupPreviewResponse,
    useGetOwnerBackupStatusQuery,
    usePreviewBackupMutation,
    useRestoreMyBackupMutation,
    useSendBackupToMyTelegramMutation,
    useUnlinkMyTelegramMutation,
} from "@/context/services/backupApi";
import { useAppSelector } from "@/context/hooks";
import { API_BASE_URL } from "@/context/env";
import { cn } from "@/lib/utils";

interface OwnerBackupSectionProps {
    compact?: boolean;
    showHeader?: boolean;
}

export default function OwnerBackupSection({
    compact = false,
    showHeader = true,
}: OwnerBackupSectionProps) {
    const { data: status, isLoading, refetch } = useGetOwnerBackupStatusQuery();
    const [sendToTelegram, { isLoading: isSending }] =
        useSendBackupToMyTelegramMutation();
    const [unlinkTelegram, { isLoading: isUnlinking }] =
        useUnlinkMyTelegramMutation();
    const [previewBackup, { isLoading: isInspecting }] =
        usePreviewBackupMutation();
    const [restoreBackup, { isLoading: isRestoring }] =
        useRestoreMyBackupMutation();
    const accessToken = useAppSelector(state => state.identity.accessToken);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] =
        useState<BackupPreviewResponse | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Modals
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
    const [messageModal, setMessageModal] = useState<{
        open: boolean;
        type: "success" | "error" | "info";
        title: string;
        message: string;
    }>({
        open: false,
        type: "info",
        title: "",
        message: "",
    });

    const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Friendly display names for database tables
    const formatTableName = (name: string): string => {
        return name
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setPreviewData(null);
        setPreviewError(null);

        if (!file) return;

        // Auto-inspect the file to generate preview
        const formData = new FormData();
        formData.append("file", file);

        try {
            const preview = await previewBackup(formData).unwrap();
            setPreviewData(preview);
        } catch (err: any) {
            setPreviewError(
                err?.data?.message ||
                    "Failed to inspect the file. Please ensure it is a valid Restorch (.sql.gz or .sql) archive.",
            );
        }
    }

    async function handleSendTestTelegram() {
        setSendSuccessMsg(null);
        try {
            const res = await sendToTelegram().unwrap();
            setSendSuccessMsg(
                `Backup file (${res.sizeKb} KB) was successfully sent to your Telegram! Check your Telegram app.`,
            );
            refetch();
        } catch (err: any) {
            setMessageModal({
                open: true,
                type: "error",
                title: "Telegram Send Failed",
                message:
                    err?.data?.message || "Failed to send backup to Telegram.",
            });
        }
    }

    async function handleUnlinkConfirm() {
        try {
            await unlinkTelegram().unwrap();
            setIsUnlinkModalOpen(false);
            setSendSuccessMsg(null);
            refetch();
            setMessageModal({
                open: true,
                type: "success",
                title: "Telegram Disconnected",
                message: "Automated Telegram backups have been disabled.",
            });
        } catch (err: any) {
            setMessageModal({
                open: true,
                type: "error",
                title: "Disconnect Failed",
                message: err?.data?.message || "Failed to disconnect Telegram.",
            });
        }
    }

    async function handleExecuteRestore() {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await restoreBackup(formData).unwrap();
            setIsRestoreModalOpen(false);
            setSelectedFile(null);
            setPreviewData(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            refetch();

            setMessageModal({
                open: true,
                type: "success",
                title: "Restaurant Restored Successfully!",
                message: `Successfully synchronized and restored ${res.tenantName}! Executed ${res.statementsCount} SQL statements safely in an isolated PostgreSQL transaction.`,
            });
        } catch (err: any) {
            setIsRestoreModalOpen(false);
            setMessageModal({
                open: true,
                type: "error",
                title: "Restoration Failed",
                message:
                    err?.data?.message ||
                    "Restoration failed. Please check the archive file.",
            });
        }
    }

    // Direct manual download
    async function handleDownloadClick() {
        setIsDownloading(true);
        try {
            const downloadUrl = `${API_BASE_URL}/backup/export-download`;
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
                let errorMsg = `Download failed (${res.status})`;
                try {
                    const json = await res.json();
                    if (json.message) errorMsg = json.message;
                } catch {
                    // ignore
                }
                throw new Error(errorMsg);
            }

            const disposition = res.headers.get("Content-Disposition");
            let filename = "restorch_backup.sql.gz";
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
            setMessageModal({
                open: true,
                type: "error",
                title: "Download Failed",
                message: err?.message || "Failed to download backup archive.",
            });
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div className="space-y-4" id="backup-settings">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-[14px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                            <Database className="size-4 text-emerald-600" />
                            <span>Automated Backups & Disaster Recovery</span>
                        </h2>
                        <p className="text-[12px] text-slate-gray">
                            100% tenant-isolated database archives delivered to
                            Telegram and on-demand recovery.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="h-8 gap-1.5 text-xs text-slate-600 border-slate-200 shrink-0"
                    >
                        <RefreshCw
                            className={cn(
                                "size-3.5",
                                isLoading && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                </div>
            )}

            {/* Top Security Banner */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-800 flex items-start gap-3">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-950">
                        Zero Data Leaks • 100% Tenant Isolated
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                        Every backup contains exclusively your restaurant's
                        tables (waiters, orders, bills, inventory, shifts,
                        menus). Other restaurants' records are strictly
                        excluded, and archives are compressed in standard
                        PostgreSQL Gzip format.
                    </p>
                </div>
            </div>

            <div
                className={cn(
                    "grid gap-4",
                    compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
                )}
            >
                {/* CARD 1: AUTOMATED TELEGRAM BACKUP */}
                <div className="rounded-xl border border-hairline bg-card p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold">
                                    <Send className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-foreground">
                                        Telegram Auto-Backup
                                    </h3>
                                    <p className="text-[11px] text-slate-gray">
                                        Bot: @
                                        {status?.botUsername ||
                                            "restorch_backup_bot"}
                                    </p>
                                </div>
                            </div>

                            <Badge
                                variant={
                                    status?.telegramLinked
                                        ? "default"
                                        : "secondary"
                                }
                                className={cn(
                                    "text-[10px] font-semibold",
                                    status?.telegramLinked
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                {status?.telegramLinked
                                    ? "Connected"
                                    : "Not Linked"}
                            </Badge>
                        </div>

                        <p className="text-[12px] text-slate-gray leading-relaxed">
                            Connect our official <b>Restorch Telegram Bot</b> to
                            receive your daily database backup directly in your
                            Telegram chat every midnight.
                        </p>

                        {/* Connection Status Details */}
                        {status?.telegramLinked ? (
                            <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-2 border border-border/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-gray">
                                        Telegram Username:
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        @{status.telegramUsername || "Linked"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-gray">
                                        Chat ID:
                                    </span>
                                    <span className="font-mono text-muted-foreground text-[11px]">
                                        {status.telegramChatId}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-gray">
                                        Schedule:
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        Daily (Midnight 00:00 EAT)
                                    </span>
                                </div>
                                {status.lastBackupAt && (
                                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                                        <span className="text-slate-gray">
                                            Last Sent:
                                        </span>
                                        <span className="text-foreground font-medium">
                                            {new Date(
                                                status.lastBackupAt,
                                            ).toLocaleString()}{" "}
                                            ({status.lastBackupSizeKb} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300 space-y-1 border border-amber-500/20">
                                <p className="font-semibold text-[11px]">
                                    Connect in 10 seconds:
                                </p>
                                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-muted-foreground">
                                    <li>Click "Connect Telegram Bot" below.</li>
                                    <li>
                                        Tap <b>START</b> in your Telegram app.
                                    </li>
                                    <li>
                                        Restorch links your restaurant
                                        automatically.
                                    </li>
                                </ol>
                            </div>
                        )}

                        {sendSuccessMsg && (
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                <span>{sendSuccessMsg}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-hairline flex flex-wrap gap-2">
                        {status?.telegramLinked ? (
                            <>
                                <Button
                                    type="button"
                                    onClick={handleSendTestTelegram}
                                    disabled={isSending}
                                    className="flex-1 h-9 gap-1.5 rounded-xl font-semibold text-xs"
                                >
                                    {isSending ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Send className="size-3.5" />
                                    )}
                                    <span>Send to My Telegram Now</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsUnlinkModalOpen(true)}
                                    disabled={isUnlinking}
                                    className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                    title="Disconnect Telegram"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </>
                        ) : (
                            <a
                                href={
                                    status?.deepLinkUrl ||
                                    "https://t.me/restorch_backup_bot"
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                            >
                                <Button
                                    type="button"
                                    className="w-full h-9 gap-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                                >
                                    <span>Connect Telegram Bot</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* CARD 2: INSTANT DIRECT DOWNLOAD */}
                <div className="rounded-xl border border-hairline bg-card p-4 sm:p-5 shadow-subtle flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold">
                                <Database className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-foreground">
                                    Instant Database Archive
                                </h3>
                                <p className="text-[11px] text-slate-gray">
                                    Export full snapshot (.sql.gz)
                                </p>
                            </div>
                        </div>

                        <p className="text-[12px] text-slate-gray leading-relaxed">
                            Generate and download a complete, standalone backup
                            archive of your restaurant's database directly to
                            your computer or phone.
                        </p>

                        <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-2 border border-border/40">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-gray">
                                    Tables Included:
                                </span>
                                <span className="font-semibold text-foreground">
                                    48 Operational Tables
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-gray">Format:</span>
                                <span className="font-mono text-muted-foreground text-[11px]">
                                    PostgreSQL Gzip (.sql.gz)
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-gray">
                                    Content:
                                </span>
                                <span className="text-foreground text-[11px]">
                                    Waiters, Orders, Bills, Menus, Inventory
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-hairline">
                        <Button
                            type="button"
                            onClick={handleDownloadClick}
                            disabled={isDownloading}
                            className="w-full h-9 gap-1.5 rounded-xl font-semibold text-xs"
                        >
                            {isDownloading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Download className="size-3.5" />
                            )}
                            <span>
                                {isDownloading
                                    ? "Generating Archive..."
                                    : "Download Full Archive (.sql.gz)"}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* CARD 3: DISASTER RECOVERY, ARCHIVE PREVIEW & RESTORE */}
            <div className="rounded-xl border border-hairline bg-card p-4 sm:p-5 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold">
                            <HardDriveDownload className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground">
                                Disaster Recovery & Pre-Import Inspection
                            </h3>
                            <p className="text-[11px] text-slate-gray">
                                Inspect and preview backup file contents before
                                re-importing into your restaurant
                            </p>
                        </div>
                    </div>

                    {previewData && (
                        <Badge
                            variant={
                                previewData.isTenantMatch ? "default" : "danger"
                            }
                            className={cn(
                                "text-[10px] font-semibold gap-1",
                                previewData.isTenantMatch
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
                            )}
                        >
                            {previewData.isTenantMatch ? (
                                <>
                                    <ShieldCheck className="size-3" />
                                    Restaurant Verified
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="size-3" />
                                    Tenant Mismatch
                                </>
                            )}
                        </Badge>
                    )}
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                        <b>Safety Guarantee:</b> Uploading a verified Restorch
                        archive automatically verifies data integrity and runs
                        strictly inside an isolated PostgreSQL transaction.
                        Records from other tenants will never be touched.
                    </p>
                </div>

                {/* File Drop / Select Area */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".sql,.sql.gz,.gz"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer border border-border rounded-xl p-1"
                        />

                        <Button
                            type="button"
                            onClick={() => setIsRestoreModalOpen(true)}
                            disabled={
                                !selectedFile ||
                                !previewData ||
                                isInspecting ||
                                isRestoring
                            }
                            className="w-full sm:w-auto h-9 px-4 gap-1.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 disabled:opacity-50 shrink-0"
                        >
                            {isRestoring ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Upload className="size-3.5" />
                            )}
                            <span>Restore Restaurant Data</span>
                        </Button>
                    </div>

                    {/* Inspecting state */}
                    {isInspecting && (
                        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 flex items-center justify-center gap-2 text-xs text-primary font-medium animate-pulse">
                            <Loader2 className="size-4 animate-spin" />
                            <span>
                                Inspecting and verifying archive structure...
                            </span>
                        </div>
                    )}

                    {/* Inspection Error */}
                    {previewError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-3 text-xs text-red-900 dark:text-red-300 flex items-start gap-2">
                            <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">
                                    Archive Verification Failed
                                </p>
                                <p className="text-[11px] mt-0.5">
                                    {previewError}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* PRE-IMPORT DATA PREVIEW CARD */}
                    {previewData && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <FileCheck2 className="size-4 text-emerald-600" />
                                        <span className="font-semibold text-xs text-foreground">
                                            Archive Verified:{" "}
                                            {previewData.tenantName}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Exported on:{" "}
                                        {new Date(
                                            previewData.exportedAt,
                                        ).toLocaleString()}{" "}
                                        ({previewData.fileSizeKb} KB compressed)
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-mono"
                                    >
                                        {previewData.totalStatements} SQL
                                        Statements
                                    </Badge>
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                        {previewData.totalRecords} Total Records
                                    </Badge>
                                </div>
                            </div>

                            {/* Tables Breakdown Grid */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                    <TableProperties className="size-3.5 text-primary" />
                                    <span>
                                        Tables Included in Backup (
                                        {previewData.tables.length})
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {previewData.tables.map(table => (
                                        <div
                                            key={table.tableName}
                                            className="rounded-lg border border-border/60 bg-card p-2 text-xs flex items-center justify-between"
                                        >
                                            <span className="text-[11px] font-medium text-foreground truncate pr-1">
                                                {formatTableName(
                                                    table.tableName,
                                                )}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] font-mono px-1.5 py-0 h-4"
                                            >
                                                {table.recordsCount}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* LOCAL MODAL: CONFIRM RESTORE */}
            {/* ========================================================================= */}
            <Dialog
                open={isRestoreModalOpen}
                onOpenChange={setIsRestoreModalOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <DialogTitle>
                                    Confirm Database Restore
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Target Restaurant:{" "}
                                    <b>
                                        {status?.tenantName ||
                                            "Active Restaurant"}
                                    </b>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs text-foreground">
                        <p className="leading-relaxed">
                            You are about to restore{" "}
                            <b>{previewData?.totalRecords ?? 0} records</b>{" "}
                            across{" "}
                            <b>
                                {previewData?.tables?.length ?? 0} operational
                                tables
                            </b>{" "}
                            from this archive:
                        </p>

                        <div className="rounded-xl bg-muted p-3 space-y-1.5 border font-mono text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Archive Name:
                                </span>
                                <span className="font-semibold text-foreground truncate max-w-[200px]">
                                    {selectedFile?.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Exported Date:
                                </span>
                                <span>
                                    {previewData
                                        ? new Date(
                                              previewData.exportedAt,
                                          ).toLocaleString()
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Archive Size:
                                </span>
                                <span>{previewData?.fileSizeKb} KB</span>
                            </div>
                        </div>

                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
                            <p>
                                ⚠️ Current database tables will be updated to
                                match this archive. This action runs inside a
                                protected transaction.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRestoreModalOpen(false)}
                            disabled={isRestoring}
                            className="rounded-xl text-xs h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleExecuteRestore}
                            disabled={isRestoring}
                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 gap-1.5"
                        >
                            {isRestoring ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Restoring Data...
                                </>
                            ) : (
                                <>
                                    <HardDriveDownload className="size-3.5" />
                                    Yes, Restore Data Now
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* LOCAL MODAL: CONFIRM UNLINK TELEGRAM */}
            {/* ========================================================================= */}
            <Dialog
                open={isUnlinkModalOpen}
                onOpenChange={setIsUnlinkModalOpen}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <DialogTitle>Disconnect Telegram</DialogTitle>
                                <DialogDescription className="text-xs">
                                    @
                                    {status?.telegramUsername ||
                                        "Linked account"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-2 text-xs text-muted-foreground leading-relaxed">
                        Are you sure you want to disconnect automated Telegram
                        backups? You will no longer receive daily database
                        archives at midnight.
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsUnlinkModalOpen(false)}
                            disabled={isUnlinking}
                            className="rounded-xl text-xs h-9"
                        >
                            Keep Connected
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleUnlinkConfirm}
                            disabled={isUnlinking}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 gap-1.5"
                        >
                            {isUnlinking ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                "Disconnect"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================================= */}
            {/* LOCAL MODAL: MESSAGE / ALERT NOTIFICATION */}
            {/* ========================================================================= */}
            <Dialog
                open={messageModal.open}
                onOpenChange={open => setMessageModal(m => ({ ...m, open }))}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2.5">
                            <div
                                className={cn(
                                    "flex size-9 items-center justify-center rounded-xl",
                                    messageModal.type === "success" &&
                                        "bg-emerald-500/15 text-emerald-600",
                                    messageModal.type === "error" &&
                                        "bg-rose-500/15 text-rose-600",
                                    messageModal.type === "info" &&
                                        "bg-blue-500/15 text-blue-600",
                                )}
                            >
                                {messageModal.type === "success" ? (
                                    <CheckCircle2 className="size-5" />
                                ) : messageModal.type === "error" ? (
                                    <AlertTriangle className="size-5" />
                                ) : (
                                    <Info className="size-5" />
                                )}
                            </div>
                            <div>
                                <DialogTitle>{messageModal.title}</DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-2 text-xs text-foreground leading-relaxed">
                        {messageModal.message}
                    </div>

                    <DialogFooter>
                        <Button
                            size="sm"
                            onClick={() =>
                                setMessageModal(m => ({ ...m, open: false }))
                            }
                            className="rounded-xl text-xs h-9 px-4"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

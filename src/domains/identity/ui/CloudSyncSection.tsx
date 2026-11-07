"use client";

import { useEffect, useState } from "react";
import {
    Cloud,
    CloudOff,
    RefreshCw,
    DownloadCloud,
    CheckCircle2,
    ShieldCheck,
    Image as ImageIcon,
    Database,
    Zap,
    Info,
    Loader2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    useGetSyncStatusQuery,
    usePullAllFromCloudMutation,
    useTriggerSyncNowMutation,
    useUpdateSyncConfigMutation,
} from "@/context/services/syncApi";

function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                checked ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
                disabled && "opacity-50 cursor-not-allowed",
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    checked ? "translate-x-4" : "translate-x-0",
                )}
            />
        </button>
    );
}

export default function CloudSyncSection() {
    const {
        data: status,
        isLoading: isStatusLoading,
        refetch,
    } = useGetSyncStatusQuery(undefined, {
        pollingInterval: 10000,
    });

    const [pullAllFromCloud, { isLoading: isPulling }] =
        usePullAllFromCloudMutation();
    const [triggerSyncNow, { isLoading: isSyncingNow }] =
        useTriggerSyncNowMutation();
    const [updateSyncConfig, { isLoading: isUpdatingConfig }] =
        useUpdateSyncConfigMutation();

    // Form states
    const [cloudUrl, setCloudUrl] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [token, setToken] = useState("");
    const [downloadImages, setDownloadImages] = useState(true);
    const [autoSync, setAutoSync] = useState(false);

    // Sync progress tracking
    const [lastSyncResult, setLastSyncResult] = useState<{
        tenantName?: string;
        statementsExecuted?: number;
        imagesCachedCount?: number;
    } | null>(null);

    useEffect(() => {
        if (status) {
            if (status.cloudSyncUrl && !cloudUrl)
                setCloudUrl(status.cloudSyncUrl);
            if (status.tenantId && !tenantId) setTenantId(status.tenantId);
            setAutoSync(status.offlineSyncEnabled);
        }
    }, [status]);

    const handleInitialPull = async () => {
        if (!cloudUrl.trim() || !tenantId.trim()) {
            toast.error("Please provide both Cloud Server URL and Tenant ID.");
            return;
        }

        try {
            toast.info(
                "Connecting to Cloud server and fetching restaurant data...",
            );
            const res = await pullAllFromCloud({
                cloudUrl: cloudUrl.trim(),
                tenantId: tenantId.trim(),
                token: token.trim() || undefined,
                downloadImages,
            }).unwrap();

            setLastSyncResult({
                tenantName: res.tenantName,
                statementsExecuted: res.statementsExecuted,
                imagesCachedCount: res.imagesCachedCount,
            });

            toast.success(
                `Initial sync successful! Restored "${res.tenantName}" and cached ${res.imagesCachedCount} images locally.`,
            );
            refetch();
        } catch (err: any) {
            toast.error(
                err?.data?.message ||
                    err.message ||
                    "Failed to fetch data from Cloud.",
            );
        }
    };

    const handleTriggerSync = async () => {
        try {
            const res = await triggerSyncNow().unwrap();
            if (res.status === "offline") {
                toast.info(
                    "Cloud server currently unreachable. System is operating safely offline.",
                );
            } else {
                toast.success(res.message || "Sync cycle completed.");
            }
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || "Sync error.");
        }
    };

    const handleToggleAutoSync = async (enabled: boolean) => {
        setAutoSync(enabled);
        try {
            await updateSyncConfig({
                offlineSyncEnabled: enabled,
                cloudSyncUrl: cloudUrl.trim() || undefined,
                tenantId: tenantId.trim() || undefined,
                cloudSyncToken: token.trim() || undefined,
            }).unwrap();
            toast.success(
                enabled
                    ? "Automatic background sync enabled."
                    : "Automatic sync disabled.",
            );
            refetch();
        } catch {
            toast.error("Failed to update auto-sync setting.");
        }
    };

    const isConnected = status?.cloudReachable;

    return (
        <div className="space-y-6">
            {/* Live Status Header */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                {isConnected ? (
                                    <Cloud className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <CloudOff className="h-5 w-5 text-amber-600" />
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    Cloud Synchronization Status
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Seamlessly synchronizes local offline
                                    orders, bills, and menu updates with your
                                    central SaaS server.
                                </CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <Badge
                                    variant="outline"
                                    className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1.5"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Cloud Connected
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1.5"
                                >
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    100% Offline Mode
                                </Badge>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs"
                                onClick={handleTriggerSync}
                                disabled={isSyncingNow || isStatusLoading}
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${isSyncingNow ? "animate-spin" : ""}`}
                                />
                                Sync Now
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                            <div className="text-xs text-muted-foreground">
                                Active Server URL
                            </div>
                            <div className="text-xs font-mono font-medium truncate mt-1">
                                {status?.cloudSyncUrl || "Not connected"}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                            <div className="text-xs text-muted-foreground">
                                Local Unsynced Orders
                            </div>
                            <div className="text-xs font-semibold mt-1 flex items-center gap-1.5">
                                <Database className="h-3.5 w-3.5 text-primary" />
                                <span>
                                    {status?.pendingOrdersCount ?? 0} orders
                                    waiting
                                </span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                            <div className="text-xs text-muted-foreground">
                                Last Successful Sync
                            </div>
                            <div className="text-xs font-medium mt-1">
                                {status?.lastSyncedAt
                                    ? new Date(
                                          status.lastSyncedAt,
                                      ).toLocaleTimeString()
                                    : "Never synced"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Initial 1-Click Pull Setup */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-base">
                        <DownloadCloud className="h-5 w-5" />
                        1-Click Initial Setup: Fetch All Restaurant Data
                    </div>
                    <CardDescription className="text-xs">
                        Shifts an existing restaurant from Contabo cloud down to
                        this offline PC without export/import files.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="cloudUrl"
                                className="text-xs font-medium"
                            >
                                Contabo Cloud Server URL
                            </Label>
                            <Input
                                id="cloudUrl"
                                placeholder="https://api.yourcloudrestaurant.com"
                                value={cloudUrl}
                                onChange={e => setCloudUrl(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="tenantId"
                                className="text-xs font-medium"
                            >
                                Restaurant Tenant ID (UUID)
                            </Label>
                            <Input
                                id="tenantId"
                                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                value={tenantId}
                                onChange={e => setTenantId(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="token"
                                className="text-xs font-medium"
                            >
                                Sync API Secret Token (Optional)
                            </Label>
                            <Input
                                id="token"
                                type="password"
                                placeholder="Enter sync token if configured"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                    Pre-cache Cloudinary Images
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                    Downloads dish photos directly to PC drive
                                    for offline viewing.
                                </p>
                            </div>
                            <ToggleSwitch
                                checked={downloadImages}
                                onChange={setDownloadImages}
                            />
                        </div>
                    </div>

                    {lastSyncResult && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">
                                    Initial Sync Successful for{" "}
                                    {lastSyncResult.tenantName}!
                                </p>
                                <p className="text-muted-foreground mt-0.5">
                                    Restored {lastSyncResult.statementsExecuted}{" "}
                                    records and cached{" "}
                                    {lastSyncResult.imagesCachedCount} dish
                                    photos locally.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <span>
                                Zero raw source code transferred. Local database
                                updated safely.
                            </span>
                        </div>

                        <Button
                            onClick={handleInitialPull}
                            disabled={isPulling}
                            className="w-full sm:w-auto h-9 gap-2 text-xs font-semibold bg-primary text-primary-foreground"
                        >
                            {isPulling ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Fetching & Caching Images...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4" />
                                    Fetch All Data & Cache Images
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Background Auto-Sync Settings */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        Automatic Background Sync
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Automatically pushes local orders and bills to Cloud
                        when internet is available.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
                        <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground">
                                Enable Automatic Background Sync
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Runs quietly every 45 seconds. Automatically
                                pauses when offline without error popups.
                            </div>
                        </div>
                        <ToggleSwitch
                            checked={autoSync}
                            onChange={handleToggleAutoSync}
                            disabled={isUpdatingConfig}
                        />
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">
                                How Offline Resilience Works
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                                Even during an internet blackout, the POS
                                continues working at full speed. All customer
                                bills, waiter orders, and kitchen beeps operate
                                locally. Once internet returns, data
                                automatically syncs back to the cloud.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

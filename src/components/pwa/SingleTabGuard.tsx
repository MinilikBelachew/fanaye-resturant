"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppWindow, ArrowRightLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { RestorchLogo } from "@/components/common/RestorchLogo";
import { Button } from "@/components/ui/button";

const LOCK_KEY = "restorch.activeTab";
const CHANNEL_NAME = "restorch.singleTab";
const HEARTBEAT_MS = 2000;
const STALE_MS = 7000;

type TabLock = {
    tabId: string;
    updatedAt: number;
};

type TabMessage =
    | { type: "CLAIMED"; tabId: string }
    | { type: "RELEASE"; tabId: string };

function createTabId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLock(): TabLock | null {
    try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<TabLock>;
        if (
            typeof parsed.tabId === "string" &&
            typeof parsed.updatedAt === "number"
        ) {
            return { tabId: parsed.tabId, updatedAt: parsed.updatedAt };
        }
        return null;
    } catch {
        return null;
    }
}

function writeLock(tabId: string): boolean {
    try {
        localStorage.setItem(
            LOCK_KEY,
            JSON.stringify({ tabId, updatedAt: Date.now() }),
        );
        return true;
    } catch {
        return false;
    }
}

function clearOwnLock(tabId: string): void {
    try {
        const current = readLock();
        if (current?.tabId === tabId) {
            localStorage.removeItem(LOCK_KEY);
        }
    } catch {
        // Ignore storage errors on teardown
    }
}

function isLockActive(lock: TabLock | null, ownTabId: string): boolean {
    if (!lock) return false;
    if (lock.tabId === ownTabId) return false;
    return Date.now() - lock.updatedAt < STALE_MS;
}

/**
 * Ensures only one browser tab / PWA window runs the authenticated Restorch OS
 * shell at a time, preventing duplicate sockets, orders, and printer locks.
 */
export default function SingleTabGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations("pwa");
    const [status, setStatus] = useState<"checking" | "active" | "blocked">(
        "checking",
    );
    const tabIdRef = useRef<string | null>(null);
    const channelRef = useRef<BroadcastChannel | null>(null);

    const broadcast = useCallback((msg: TabMessage) => {
        try {
            channelRef.current?.postMessage(msg);
        } catch {
            // Ignore closed/unsupported channel errors
        }
    }, []);

    const claimLock = useCallback(() => {
        const tabId = tabIdRef.current;
        if (!tabId) return;
        writeLock(tabId);
        broadcast({ type: "CLAIMED", tabId });
        setStatus("active");
    }, [broadcast]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const tabId = tabIdRef.current ?? createTabId();
        tabIdRef.current = tabId;

        const channel =
            "BroadcastChannel" in window
                ? new BroadcastChannel(CHANNEL_NAME)
                : null;
        channelRef.current = channel;

        const existing = readLock();
        if (isLockActive(existing, tabId)) {
            setStatus("blocked");
        } else {
            writeLock(tabId);
            channel?.postMessage({
                type: "CLAIMED",
                tabId,
            } satisfies TabMessage);
            setStatus("active");
        }

        const handleMessage = (event: MessageEvent<TabMessage>) => {
            const data = event.data;
            if (!data || data.tabId === tabId) return;

            if (data.type === "CLAIMED") {
                setStatus("blocked");
            } else if (data.type === "RELEASE") {
                const current = readLock();
                if (!isLockActive(current, tabId)) {
                    writeLock(tabId);
                    channel?.postMessage({
                        type: "CLAIMED",
                        tabId,
                    } satisfies TabMessage);
                    setStatus("active");
                }
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== LOCK_KEY) return;
            const current = readLock();
            if (!current) {
                writeLock(tabId);
                channel?.postMessage({
                    type: "CLAIMED",
                    tabId,
                } satisfies TabMessage);
                setStatus("active");
                return;
            }
            if (isLockActive(current, tabId)) {
                setStatus("blocked");
            }
        };

        const handleRelease = () => {
            const current = readLock();
            if (current?.tabId === tabId) {
                clearOwnLock(tabId);
                channel?.postMessage({
                    type: "RELEASE",
                    tabId,
                } satisfies TabMessage);
            }
        };

        channel?.addEventListener("message", handleMessage);
        window.addEventListener("storage", handleStorage);
        window.addEventListener("pagehide", handleRelease);
        window.addEventListener("beforeunload", handleRelease);

        const heartbeat = window.setInterval(() => {
            setStatus(prev => {
                if (prev !== "active") return prev;
                const current = readLock();
                if (isLockActive(current, tabId)) {
                    return "blocked";
                }
                writeLock(tabId);
                return prev;
            });
        }, HEARTBEAT_MS);

        return () => {
            window.clearInterval(heartbeat);
            channel?.removeEventListener("message", handleMessage);
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("pagehide", handleRelease);
            window.removeEventListener("beforeunload", handleRelease);
            handleRelease();
            channel?.close();
            channelRef.current = null;
        };
    }, []);

    if (status === "checking") {
        return null;
    }

    if (status === "blocked") {
        return (
            <div className="flex min-h-svh w-full items-center justify-center bg-background p-4">
                <div className="w-full max-w-md rounded-2xl border border-hairline bg-card p-6 text-center shadow-xl">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <AppWindow className="size-7" />
                    </div>
                    <div className="mb-3 flex justify-center">
                        <RestorchLogo variant="full" height={24} />
                    </div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                        {t("singleTabTitle")}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t("singleTabBody")}
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                        <Button className="w-full gap-2" onClick={claimLock}>
                            <ArrowRightLeft className="size-4" />
                            {t("useThisTab")}
                        </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                        {t("singleTabHint")}
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

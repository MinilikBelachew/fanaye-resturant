"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useLocale } from "next-intl";
import { SOCKET_BASE_URL } from "@/context/env";
import { usePinLoginMutation } from "@/context/services/authApi";
import {
    fetchFloorKioskBoard,
    verifyFloorKioskTableAccess,
    type FloorKioskBoardResponse,
    type FloorKioskTable,
} from "@/context/services/floorKioskApi";
import { useRouter } from "@/i18n/navigation";
import { RestorchLogo } from "@/components/common/RestorchLogo";
import { ThemeToggleButton } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";
import { toast } from "@/lib/toast";
import {
    formatCalendarDateTime,
    useCalendarMode,
} from "@/hooks/useCalendarMode";
import {
    AlertTriangle,
    BellRing,
    CheckCircle2,
    Clock,
    Crown,
    Delete,
    Lock,
    LogIn,
    RefreshCw,
    Unlink,
    User,
    X,
} from "lucide-react";

const KIOSK_TOKEN_KEY = "restorch_floor_kiosk_token";
const KIOSK_TENANT_KEY = "restorch_floor_kiosk_tenant_id";
const KIOSK_BRANCH_NAME_KEY = "restorch_floor_kiosk_branch_name";
const KIOSK_PAIRED_KEY = "restorch_floor_kiosk_paired";

function playReadyChime() {
    if (typeof window === "undefined") return;
    try {
        const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        [587.33, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + i * 0.14);
            gain.gain.setValueAtTime(0.14, now + i * 0.14);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + i * 0.14 + 0.35,
            );
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.14);
            osc.stop(now + i * 0.14 + 0.36);
        });
    } catch {
        // Ignore audio autoplay restrictions
    }
}

function formatElapsed(ms: number) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function FloorKioskPage() {
    const locale = useLocale();
    const isAm = locale === "am";
    const router = useRouter();
    const { calendarMode } = useCalendarMode();
    const [loginWithPin] = usePinLoginMutation();

    // Kiosk device session
    const [kioskToken, setKioskToken] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string>("");
    const [branchName, setBranchName] = useState<string>("");
    const [isPaired, setIsPaired] = useState(false);

    // Live floor board
    const [board, setBoard] = useState<FloorKioskBoardResponse | null>(null);
    const [isLoadingBoard, setIsLoadingBoard] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [filter, setFilter] = useState<
        "ALL" | "READY" | "OVERDUE" | "AVAILABLE"
    >("ALL");
    const [readyBanner, setReadyBanner] = useState<string | null>(null);
    const [nowMs, setNowMs] = useState(() => Date.now());

    // Personal waiter PIN modal when clicking a table
    const [selectedTable, setSelectedTable] = useState<FloorKioskTable | null>(
        null,
    );
    const [waiterPin, setWaiterPin] = useState("");
    const [waiterPinError, setWaiterPinError] = useState("");
    const [isVerifyingWaiter, setIsVerifyingWaiter] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // Hydrate saved kiosk session
    useEffect(() => {
        if (typeof window === "undefined") return;
        const savedToken = localStorage.getItem(KIOSK_TOKEN_KEY);
        const savedTenant =
            localStorage.getItem(KIOSK_TENANT_KEY) ||
            localStorage.getItem("terminal_tenant_id") ||
            "";
        const savedBranchName =
            localStorage.getItem(KIOSK_BRANCH_NAME_KEY) || "";
        const paired = localStorage.getItem(KIOSK_PAIRED_KEY) === "1";
        setIsPaired(paired);
        if (savedTenant) {
            setTenantId(savedTenant);
        }
        if (savedBranchName) setBranchName(savedBranchName);
        if (savedToken) {
            setKioskToken(savedToken);
        } else {
            router.replace("/sign-in");
        }
    }, [router]);

    // 1-second live timer for ready/overdue countdowns
    useEffect(() => {
        const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const loadBoard = useCallback(
        async (silent = false) => {
            if (!kioskToken) return;
            if (!silent) setIsLoadingBoard(true);
            try {
                const data = await fetchFloorKioskBoard(kioskToken);
                setBoard(data);
            } catch {
                // Token expired or invalid -> clear pairing & return to sign-in
                localStorage.removeItem(KIOSK_TOKEN_KEY);
                localStorage.removeItem(KIOSK_PAIRED_KEY);
                setKioskToken(null);
                setBoard(null);
                router.replace("/sign-in");
            } finally {
                if (!silent) setIsLoadingBoard(false);
            }
        },
        [kioskToken, router],
    );

    useEffect(() => {
        if (kioskToken) {
            void loadBoard(false);
        }
    }, [kioskToken, loadBoard]);

    // Real-time /ops Socket.IO listener for item.ready & floor updates
    useEffect(() => {
        if (!kioskToken) return;
        const base = SOCKET_BASE_URL.replace(/\/$/, "");
        const socket = io(`${base}/ops`, {
            auth: { token: kioskToken },
            transports: ["websocket", "polling"],
            withCredentials: true,
        });

        socket.on("connect", () => {
            setSocketConnected(true);
            void loadBoard(true);
        });
        socket.on("disconnect", () => setSocketConnected(false));
        socket.on("connect_error", () => setSocketConnected(false));
        socket.on(
            "ops.notify",
            (event: { type?: string; title?: string; body?: string }) => {
                const t = event?.type ?? "";
                if (
                    t === "item.ready" ||
                    t === "floor.updated" ||
                    t === "ticket.queued" ||
                    t === "ticket.updated" ||
                    t === "bill.request.created" ||
                    t === "bill.ready" ||
                    t === "payment.settled"
                ) {
                    void loadBoard(true);
                }
                if (t === "item.ready") {
                    playReadyChime();
                    setReadyBanner(
                        event?.body ||
                            event?.title ||
                            (isAm
                                ? "ምግብ በማውጫው ዝግጁ ነው!"
                                : "Food is ready at the kitchen pass!"),
                    );
                    window.setTimeout(() => setReadyBanner(null), 6000);
                }
            },
        );

        return () => {
            socket.disconnect();
        };
    }, [kioskToken, loadBoard, isAm]);

    // Backup polling only when Socket.IO is down
    useEffect(() => {
        if (!kioskToken || socketConnected) return;
        const pollId = window.setInterval(() => {
            void loadBoard(true);
        }, 4000);
        return () => window.clearInterval(pollId);
    }, [kioskToken, socketConnected, loadBoard]);

    const handleWaiterPinSubmit = async (pinToUse?: string) => {
        if (!selectedTable || !kioskToken) return;
        const pin = pinToUse ?? waiterPin;
        if (pin.length !== 4) {
            setWaiterPinError(
                isAm ? "ባለ 4 አሃዝ ፒን ያስገቡ።" : "Enter your 4-digit PIN.",
            );
            return;
        }
        setIsVerifyingWaiter(true);
        setWaiterPinError("");
        try {
            const verified = await verifyFloorKioskTableAccess(kioskToken, {
                tableId: selectedTable.id,
                pin,
            });
            await loginWithPin({
                pin,
                tenantSlug: tenantId || undefined,
                remember: false,
            }).unwrap();
            router.push(`/waiter/tables/${verified.tableId}`);
        } catch (err: any) {
            const msg =
                err?.data?.message ||
                err?.message ||
                (isAm
                    ? "ይህ ጠረጴዛ ለእርስዎ አልተመደበም ወይም ፒኑ ስህተት ነው።"
                    : "Invalid PIN or table not assigned to you in this shift.");
            setWaiterPinError(String(msg));
            setWaiterPin("");
        } finally {
            setIsVerifyingWaiter(false);
        }
    };

    const handleGoToSignIn = () => {
        setShowExitModal(false);
        router.push("/sign-in?kiosk_exit=1");
    };

    const handleUnpairTablet = () => {
        localStorage.removeItem(KIOSK_PAIRED_KEY);
        localStorage.removeItem(KIOSK_TOKEN_KEY);
        localStorage.removeItem(KIOSK_TENANT_KEY);
        localStorage.removeItem(KIOSK_BRANCH_NAME_KEY);
        setKioskToken(null);
        setIsPaired(false);
        setShowExitModal(false);
        toast.success(
            isAm ? "ታብሌቱ በተሳካ ሁኔታ ተለያይቷል" : "Tablet unpaired successfully.",
        );
        router.replace("/sign-in");
    };

    const overdueMs = (board?.readyOverdueMinutes ?? 3) * 60 * 1000;

    const enrichedTables = useMemo(() => {
        const list = board?.tables ?? [];
        return list.map(t => {
            const readyElapsedMs = t.oldestReadyAt
                ? Math.max(0, nowMs - new Date(t.oldestReadyAt).getTime())
                : 0;
            const hasReady = t.readyItems.length > 0;
            const isOverdue = hasReady && readyElapsedMs >= overdueMs;
            return { ...t, hasReady, isOverdue, readyElapsedMs };
        });
    }, [board?.tables, nowMs, overdueMs]);

    const filteredTables = useMemo(() => {
        if (filter === "READY") return enrichedTables.filter(t => t.hasReady);
        if (filter === "OVERDUE")
            return enrichedTables.filter(t => t.isOverdue);
        if (filter === "AVAILABLE")
            return enrichedTables.filter(t => t.status === "AVAILABLE");
        return enrichedTables;
    }, [enrichedTables, filter]);

    const readyCount = enrichedTables.filter(t => t.hasReady).length;
    const overdueCount = enrichedTables.filter(t => t.isOverdue).length;

    // Redirecting to /sign-in if not unlocked
    if (!kioskToken) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 text-xs text-muted-foreground">
                {isAm ? "ወደ መግቢያ በመመለስ ላይ..." : "Redirecting to Sign In..."}
            </div>
        );
    }

    // ---- SCREEN 2: SHARED FLOOR TABLE GRID ----
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 py-3">
                <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <RestorchLogo variant="mark" height={28} />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-base font-bold">
                                    {board?.branchName ||
                                        branchName ||
                                        "Shared Floor"}
                                </h1>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                                        socketConnected
                                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    }`}
                                >
                                    <span
                                        className={`size-1.5 rounded-full ${
                                            socketConnected
                                                ? "bg-emerald-500 animate-pulse"
                                                : "bg-amber-500"
                                        }`}
                                    />
                                    {socketConnected ? "LIVE" : "RECONNECTING"}
                                </span>
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground">
                                {formatCalendarDateTime(
                                    new Date(nowMs),
                                    locale,
                                    calendarMode,
                                    true,
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <LocaleSwitcher />
                        <ThemeToggleButton className="size-8 rounded-full border border-border" />
                        <button
                            type="button"
                            onClick={() => void loadBoard(false)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                        >
                            <RefreshCw
                                className={`size-3.5 ${isLoadingBoard ? "animate-spin" : ""}`}
                            />
                            <span className="hidden sm:inline">
                                {isAm ? "አድስ" : "Refresh"}
                            </span>
                        </button>
                        {isPaired && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {isAm ? "የተጣመረ ታብሌት" : "Paired Waiter Board"}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowExitModal(true)}
                            title={
                                isAm ? "ውጣ ወይም አለያይ" : "Exit or Unpair Tablet"
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 hover:bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground active:scale-95 transition-all cursor-pointer"
                        >
                            <Lock className="size-3.5 text-muted-foreground" />
                            <span>{isAm ? "ውጣ / ቆልፍ" : "Exit / Lock"}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Live Ready Sound/Alert Banner */}
            {readyBanner ? (
                <div className="bg-emerald-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in">
                    <BellRing className="size-4 animate-bounce" />
                    <span>{readyBanner}</span>
                </div>
            ) : null}

            {/* Filter Pills */}
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {(
                        [
                            {
                                id: "ALL",
                                label: isAm
                                    ? `ሁሉም (${enrichedTables.length})`
                                    : `All Tables (${enrichedTables.length})`,
                            },
                            {
                                id: "READY",
                                label: isAm
                                    ? `ዝግጁ (${readyCount})`
                                    : `Ready at Pass (${readyCount})`,
                            },
                            {
                                id: "OVERDUE",
                                label: isAm
                                    ? `ጊዜ ያለፈበት (${overdueCount})`
                                    : `Overdue (${overdueCount})`,
                            },
                            {
                                id: "AVAILABLE",
                                label: isAm ? "ክፍት" : "Available",
                            },
                        ] as const
                    ).map(pill => (
                        <button
                            key={pill.id}
                            type="button"
                            onClick={() => setFilter(pill.id)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                filter === pill.id
                                    ? pill.id === "OVERDUE"
                                        ? "bg-rose-600 text-white"
                                        : "bg-foreground text-background"
                                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {pill.label}
                        </button>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground">
                    {isAm
                        ? "ጠረጴዛውን ሲነኩ የግል ባለ 4 አሃዝ ፒንዎን ያስገቡ"
                        : "Tap any table & enter your 4-digit Waiter PIN to open"}
                </p>
            </div>

            {/* Table Grid */}
            <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {filteredTables.map(table => {
                        const isOverdue = table.isOverdue;
                        const hasReady = table.hasReady;

                        return (
                            <button
                                key={table.id}
                                type="button"
                                onClick={() => {
                                    setSelectedTable(table);
                                    setWaiterPin("");
                                    setWaiterPinError("");
                                }}
                                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                                    isOverdue
                                        ? "border-rose-600 bg-rose-500/25 dark:bg-rose-600/30 ring-2 ring-rose-500/60 shadow-[0_0_28px_rgba(244,63,94,0.35)]"
                                        : hasReady
                                          ? "border-emerald-500 bg-emerald-500/20 dark:bg-emerald-500/25 ring-2 ring-emerald-500/50 shadow-[0_0_22px_rgba(16,185,129,0.28)]"
                                          : table.status === "BILL_REQUESTED"
                                            ? "border-amber-500/60 bg-amber-500/10"
                                            : table.status === "OCCUPIED"
                                              ? "border-orange-500/40 bg-card"
                                              : "border-border bg-card/70 hover:border-foreground/30"
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                                {table.locationName}
                                            </span>
                                            <h3 className="text-base font-bold tracking-tight flex items-center gap-1.5">
                                                {table.displayName}
                                                {table.isVip ? (
                                                    <Crown className="size-3.5 text-amber-500" />
                                                ) : null}
                                            </h3>
                                        </div>

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                                                isOverdue
                                                    ? "bg-rose-600 text-white animate-pulse"
                                                    : hasReady
                                                      ? "bg-emerald-600 text-white"
                                                      : table.status ===
                                                          "BILL_REQUESTED"
                                                        ? "bg-amber-500 text-white"
                                                        : table.status ===
                                                            "OCCUPIED"
                                                          ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                                          : "bg-secondary text-muted-foreground"
                                            }`}
                                        >
                                            {isOverdue
                                                ? isAm
                                                    ? "ዝግጁ · ዘግይቷል"
                                                    : "READY · RED"
                                                : hasReady
                                                  ? isAm
                                                      ? "ምግብ ዝግጁ"
                                                      : "FOOD READY"
                                                  : table.status ===
                                                      "BILL_REQUESTED"
                                                    ? isAm
                                                        ? "ሂሳብ"
                                                        : "BILL"
                                                    : table.status ===
                                                        "OCCUPIED"
                                                      ? isAm
                                                          ? "ተይዟል"
                                                          : "BUSY"
                                                      : isAm
                                                        ? "ክፍት"
                                                        : "FREE"}
                                        </span>
                                    </div>

                                    {/* Ready Items Alert Box */}
                                    {hasReady ? (
                                        <div
                                            className={`mt-3 rounded-xl px-2.5 py-2 text-xs ${
                                                isOverdue
                                                    ? "bg-rose-600/15 text-rose-700 dark:text-rose-200"
                                                    : "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                                                <span className="inline-flex items-center gap-1">
                                                    {isOverdue ? (
                                                        <AlertTriangle className="size-3.5" />
                                                    ) : (
                                                        <CheckCircle2 className="size-3.5" />
                                                    )}
                                                    {table.readyItems.length}{" "}
                                                    {isAm ? "ዝግጁ" : "ready"}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {formatElapsed(
                                                        table.readyElapsedMs,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mt-1 space-y-0.5 text-[11px] truncate">
                                                {table.readyItems
                                                    .slice(0, 2)
                                                    .map(ri => (
                                                        <div
                                                            key={ri.id}
                                                            className="truncate"
                                                        >
                                                            • {ri.quantity}×{" "}
                                                            {ri.name}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Assigned Waiter for Current Shift */}
                                <div className="mt-4 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground truncate">
                                        <User className="size-3 shrink-0" />
                                        <span className="truncate font-medium text-foreground/85">
                                            {table.assignedWaiterName ||
                                                (isAm
                                                    ? "ያልተመደበ"
                                                    : "Unassigned")}
                                        </span>
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>

            {/* Personal Waiter 4-Digit PIN Modal */}
            {selectedTable ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-mono uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    {selectedTable.locationName}
                                </p>
                                <h2 className="text-xl font-bold">
                                    {selectedTable.displayName}
                                </h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {selectedTable.assignedWaiterName
                                        ? isAm
                                            ? `የተመደበ አስተናጋጅ: ${selectedTable.assignedWaiterName}`
                                            : `Shift Waiter: ${selectedTable.assignedWaiterName}`
                                        : isAm
                                          ? "የግል ባለ 4 አሃዝ ፒንዎን ያስገቡ"
                                          : "Enter your 4-digit Waiter PIN"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTable(null)}
                                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* 4-digit PIN dots */}
                        <div className="mt-5 flex justify-center gap-3">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`flex size-11 items-center justify-center rounded-xl border text-lg font-bold transition ${
                                        waiterPin.length > i
                                            ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            : "border-border bg-background"
                                    }`}
                                >
                                    {waiterPin.length > i ? "•" : ""}
                                </div>
                            ))}
                        </div>

                        {waiterPinError ? (
                            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
                                {waiterPinError}
                            </div>
                        ) : null}

                        <div className="mt-5 grid grid-cols-3 gap-2">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                                d => (
                                    <button
                                        key={d}
                                        type="button"
                                        disabled={isVerifyingWaiter}
                                        onClick={() => {
                                            if (waiterPin.length >= 4) return;
                                            const next = waiterPin + d;
                                            setWaiterPin(next);
                                            if (next.length === 4) {
                                                handleWaiterPinSubmit(next);
                                            }
                                        }}
                                        className="h-12 rounded-xl border border-border bg-secondary/40 text-base font-bold hover:bg-secondary active:scale-95 transition"
                                    >
                                        {d}
                                    </button>
                                ),
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setWaiterPin("");
                                    setWaiterPinError("");
                                }}
                                className="h-12 rounded-xl border border-border bg-secondary/20 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                disabled={isVerifyingWaiter}
                                onClick={() => {
                                    if (waiterPin.length >= 4) return;
                                    const next = waiterPin + "0";
                                    setWaiterPin(next);
                                    if (next.length === 4) {
                                        handleWaiterPinSubmit(next);
                                    }
                                }}
                                className="h-12 rounded-xl border border-border bg-secondary/40 text-base font-bold hover:bg-secondary active:scale-95 transition"
                            >
                                0
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setWaiterPin(p => p.slice(0, -1))
                                }
                                className="flex h-12 items-center justify-center rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:bg-secondary"
                            >
                                <Delete className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Quick Exit / Unpair Modal (No Password Required) */}
            {showExitModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Lock className="size-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        {isAm
                                            ? "የታብሌት መቆጣጠሪያ"
                                            : "Floor Tablet Controls"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {isAm
                                            ? "ያለ ፓስዎርድ በቀላሉ መውጣት ወይም ማለያየት ይችላሉ"
                                            : "Quick exit or unpair (no password required)"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowExitModal(false)}
                                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {/* Option 1: Go to Sign-In without unpairing */}
                            <button
                                type="button"
                                onClick={handleGoToSignIn}
                                className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all group cursor-pointer"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <LogIn className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs sm:text-sm text-foreground">
                                            {isAm
                                                ? "ወደ መግቢያ ገጽ ሂድ"
                                                : "Go to Sign-In"}
                                        </span>
                                        <span className="text-[12px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                                            →
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {isAm
                                            ? "ታብሌቱ እንደተጣመረ ይቆያል፤ አስተዳዳሪ ወይም ሰራተኛ መግባት ይችላል"
                                            : "Keeps tablet paired. Sign in as Manager, Admin, or Staff."}
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Unpair Tablet Completely */}
                            <button
                                type="button"
                                onClick={handleUnpairTablet}
                                className="w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:border-rose-500 hover:bg-rose-500/10 transition-all group cursor-pointer"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                                    <Unlink className="size-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                                            {isAm
                                                ? "ይህንን ታብሌት አለያይ"
                                                : "Unpair This Tablet"}
                                        </span>
                                        <span className="text-[12px] font-semibold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                                            ✕
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {isAm
                                            ? "ይህንን መሳሪያ ከኪዮስክ ሁነታ ሙሉ በሙሉ ያስወጣል"
                                            : "Completely removes this device from shared floor kiosk mode."}
                                    </p>
                                </div>
                            </button>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/50 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowExitModal(false)}
                                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                            >
                                {isAm ? "ተመለስ" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

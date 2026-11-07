"use client";

import { useEffect, useState } from "react";
import { Bluetooth, Check, Printer, Settings, Usb } from "lucide-react";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Cached connections (same globals as DirectBluetoothPrintButton)
declare global {
    interface Window {
        _cashierBleDevice?: any;
        _cashierSerialPort?: any;
    }
}

export default function CashierSettingsPage() {
    const [printMode, setPrintMode] = useState<"bluetooth" | "station">(
        "station",
    );
    const [port, setPort] = useState("COM9");
    const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
    const [serialConnected, setSerialConnected] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load saved settings
    useEffect(() => {
        const savedMode = localStorage.getItem("pos_printer_mode") as
            | "bluetooth"
            | "station"
            | null;
        const savedPort = localStorage.getItem("pos_station_printer_port");
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const hasBle = "bluetooth" in navigator;

        if (savedMode) {
            setPrintMode(savedMode);
        } else if (isMobile && hasBle) {
            setPrintMode("bluetooth");
        }
        if (savedPort) setPort(savedPort);

        // Check cached BLE device name
        if (window._cashierBleDevice?.name) {
            setBleDeviceName(window._cashierBleDevice.name);
        }

        // Check granted serial ports
        if ("serial" in navigator) {
            (
                navigator as unknown as {
                    serial: { getPorts(): Promise<any[]> };
                }
            ).serial
                .getPorts()
                .then(ports => {
                    if (ports.length > 0) {
                        window._cashierSerialPort = ports[0];
                        setSerialConnected(true);
                    }
                })
                .catch(() => {});
        }
    }, []);

    function handleSave() {
        const cleanPort = port.trim().toUpperCase() || "COM9";
        setPort(cleanPort);
        localStorage.setItem("pos_printer_mode", printMode);
        localStorage.setItem("pos_station_printer_port", cleanPort);
        setSaved(true);
        toast.success(
            "Settings saved",
            `Printer mode: ${printMode === "bluetooth" ? "Bluetooth" : `Station port ${cleanPort}`}`,
        );
        setTimeout(() => setSaved(false), 2500);
    }

    async function handlePairBluetooth() {
        if (!("bluetooth" in navigator)) {
            toast.error(
                "Not supported",
                "Web Bluetooth requires Chrome on Android, Windows, or Mac.",
            );
            return;
        }
        try {
            const nav = navigator as unknown as {
                bluetooth: {
                    requestDevice(opts: object): Promise<any>;
                };
            };
            const device = await nav.bluetooth.requestDevice({
                filters: [
                    { namePrefix: "MPT" },
                    { namePrefix: "POS" },
                    { namePrefix: "ATP" },
                    { namePrefix: "RP" },
                    { namePrefix: "Printer" },
                ],
                optionalServices: [
                    "0000ffe0-0000-1000-8000-00805f9b34fb",
                    "000018f0-0000-1000-8000-00805f9b34fb",
                ],
            });
            window._cashierBleDevice = device;
            setBleDeviceName(device.name || "Bluetooth Printer");
            toast.success(
                "Printer paired",
                `Connected to ${device.name || "Bluetooth Printer"}`,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("cancelled")) toast.error("Pairing failed", msg);
        }
    }

    async function handlePairSerial() {
        if (!("serial" in navigator)) {
            toast.error(
                "Not supported",
                "Web Serial requires Chrome or Edge on PC.",
            );
            return;
        }
        try {
            const nav = navigator as unknown as {
                serial: { requestPort(): Promise<any> };
            };
            const selected = await nav.serial.requestPort();
            window._cashierSerialPort = selected;
            setSerialConnected(true);
            toast.success(
                "Printer connected",
                "USB/Serial printer paired successfully.",
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (
                !msg.includes("cancelled") &&
                !msg.includes("No port selected")
            ) {
                toast.error("Pairing failed", msg);
            }
        }
    }

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow="Cashier"
                title="Settings"
                description="Configure your receipt printer and station preferences."
            />

            <div className="max-w-lg space-y-5">
                {/* Printer section */}
                <section className="rounded-2xl border border-hairline bg-card">
                    <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Printer className="size-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-foreground">
                                Receipt Printer
                            </p>
                            <p className="text-[12px] text-slate-gray">
                                Direct POS thermal printer connection
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        {/* Mode toggle */}
                        <div className="space-y-2">
                            <p className="text-[12px] font-medium text-slate-gray">
                                Connection method
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPrintMode("bluetooth")}
                                    className={cn(
                                        "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all",
                                        printMode === "bluetooth"
                                            ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 dark:bg-emerald-950/20"
                                            : "border-hairline bg-card hover:border-foreground/20",
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Bluetooth className="size-4 text-emerald-600" />
                                        <span className="text-[13px] font-semibold text-foreground">
                                            Bluetooth
                                        </span>
                                        {printMode === "bluetooth" && (
                                            <Check className="ml-auto size-3.5 text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-gray">
                                        For tablets, phones & laptops — no cable
                                        needed
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPrintMode("station")}
                                    className={cn(
                                        "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all",
                                        printMode === "station"
                                            ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 dark:bg-emerald-950/20"
                                            : "border-hairline bg-card hover:border-foreground/20",
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Usb className="size-4 text-emerald-600" />
                                        <span className="text-[13px] font-semibold text-foreground">
                                            USB / COM
                                        </span>
                                        {printMode === "station" && (
                                            <Check className="ml-auto size-3.5 text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-gray">
                                        For cashier counter PCs with USB printer
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Mode-specific config */}
                        {printMode === "bluetooth" ? (
                            <div className="rounded-xl border border-hairline bg-secondary/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[13px] font-medium text-foreground">
                                            Bluetooth printer
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            {bleDeviceName
                                                ? `Paired: ${bleDeviceName}`
                                                : "Not paired yet — click to connect"}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handlePairBluetooth}
                                        className="shrink-0 gap-1.5 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Bluetooth className="size-3.5" />
                                        {bleDeviceName
                                            ? "Re-pair"
                                            : "Pair printer"}
                                    </Button>
                                </div>
                                {bleDeviceName && (
                                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                        <Check className="size-3.5" />
                                        Ready to print wirelessly
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-hairline bg-secondary/40 p-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[13px] font-medium text-foreground">
                                            USB / Serial port
                                        </p>
                                        <p className="text-[12px] text-slate-gray">
                                            {serialConnected
                                                ? "Port selected — ready to print"
                                                : "No port selected yet"}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handlePairSerial}
                                        className="shrink-0 gap-1.5 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Usb className="size-3.5" />
                                        {serialConnected
                                            ? "Change port"
                                            : "Select port"}
                                    </Button>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-medium text-slate-gray">
                                        COM port fallback (used when Web Serial
                                        is unavailable)
                                    </p>
                                    <input
                                        type="text"
                                        value={port}
                                        onChange={e => setPort(e.target.value)}
                                        placeholder="COM9"
                                        className="h-10 w-full rounded-xl border border-hairline bg-card px-3 font-mono text-[13px] uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                                    />
                                </div>

                                {serialConnected && (
                                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                        <Check className="size-3.5" />
                                        USB printer connected and ready
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save */}
                        <button
                            type="button"
                            onClick={handleSave}
                            className={cn(
                                "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-all",
                                saved
                                    ? "bg-emerald-600 text-white"
                                    : "bg-foreground text-background hover:bg-foreground/90",
                            )}
                        >
                            {saved ? (
                                <>
                                    <Check className="size-4" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Settings className="size-4" />
                                    Save printer settings
                                </>
                            )}
                        </button>
                    </div>
                </section>
            </div>
        </DashboardFrame>
    );
}

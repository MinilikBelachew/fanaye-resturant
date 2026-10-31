"use client";

import React, { useState, useEffect } from "react";
import { Printer, Settings, Loader2, Check, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Bill } from "@/domains/billing/domain/billingApi";
import { toast } from "@/lib/toast";
import { encodeReceiptToEscPos } from "@/domains/payments/utils/escposEncoder";

interface DirectBluetoothPrintButtonProps {
    bill: Bill;
    paperWidth?: "58mm" | "80mm";
    tableDisplayName?: string;
    waiterName?: string;
    cashierName?: string;
    restaurantName?: string;
    branchName?: string;
}

// Cache connected Bluetooth device across prints in this browser session
let cachedBleDevice: any = null;
let cachedCharacteristic: any = null;

export const DirectBluetoothPrintButton: React.FC<DirectBluetoothPrintButtonProps> = ({
    bill,
    paperWidth = "58mm",
    tableDisplayName,
    waiterName,
    cashierName,
    restaurantName = "Restaurant",
    branchName = "Main Branch",
}) => {
    const [printing, setPrinting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [printMode, setPrintMode] = useState<"bluetooth" | "station">("station");
    const [port, setPort] = useState("COM9");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tempPort, setTempPort] = useState("COM9");
    const [tempMode, setTempMode] = useState<"bluetooth" | "station">("station");
    const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);

    // Load saved settings from station localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPort = localStorage.getItem("pos_station_printer_port");
            const savedMode = localStorage.getItem("pos_printer_mode") as "bluetooth" | "station";
            
            // Auto-detect if on mobile/tablet and Bluetooth is available
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const hasBle = typeof navigator !== "undefined" && "bluetooth" in navigator;

            if (savedMode) {
                setPrintMode(savedMode);
                setTempMode(savedMode);
            } else if (isMobile && hasBle) {
                setPrintMode("bluetooth");
                setTempMode("bluetooth");
            }

            if (savedPort) {
                setPort(savedPort);
                setTempPort(savedPort);
            }

            if (cachedBleDevice && cachedBleDevice.name) {
                setBleDeviceName(cachedBleDevice.name);
            }
        }
    }, []);

    function handleSaveSettings() {
        const cleanPort = tempPort.trim().toUpperCase() || "COM9";
        setPort(cleanPort);
        setPrintMode(tempMode);
        localStorage.setItem("pos_station_printer_port", cleanPort);
        localStorage.setItem("pos_printer_mode", tempMode);
        setSettingsOpen(false);
        toast.success("Settings Saved", `Mode: ${tempMode.toUpperCase()} (${tempMode === "bluetooth" ? "Wireless" : cleanPort})`);
    }

    // Direct Web Bluetooth Printer Connection & Sender
    async function printViaWebBluetooth(): Promise<boolean> {
        if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
            throw new Error("Web Bluetooth is not supported on this browser. Use Chrome on Android, Windows, or Mac.");
        }

        // Standard 58mm/80mm Thermal Printer Bluetooth GATT Service & Characteristic UUIDs
        const SERVICE_UUIDS = [
            "0000ffe0-0000-1000-8000-00805f9b34fb",
            "000018f0-0000-1000-8000-00805f9b34fb",
            "49535343-fe7d-4ae5-8fa9-9fafd205e455",
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        ];

        let device = cachedBleDevice;
        let char = cachedCharacteristic;

        // If not already connected, request device
        if (!device || !device.gatt?.connected || !char) {
            toast.info("Pairing Printer", "Select your printer (e.g. MPT-II) from the list...");
            const nav = navigator as any;
            device = await nav.bluetooth.requestDevice({
                filters: [
                    { namePrefix: "MPT" },
                    { namePrefix: "POS" },
                    { namePrefix: "ATP" },
                    { namePrefix: "RP" },
                    { namePrefix: "Printer" },
                ],
                optionalServices: SERVICE_UUIDS,
            });

            cachedBleDevice = device;
            setBleDeviceName(device.name || "Bluetooth Printer");

            const server = await device.gatt.connect();

            // Find matching service
            let targetService: any = null;
            for (const uuid of SERVICE_UUIDS) {
                try {
                    targetService = await server.getPrimaryService(uuid);
                    if (targetService) break;
                } catch {
                    // Try next uuid
                }
            }

            if (!targetService) {
                // Fallback: query all services
                const services = await server.getPrimaryServices();
                if (services.length > 0) targetService = services[0];
            }

            if (!targetService) {
                throw new Error("Could not find printer write service on this Bluetooth device.");
            }

            // Find writeable characteristic
            const chars = await targetService.getCharacteristics();
            char = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || chars[0];

            if (!char) {
                throw new Error("No write characteristic found on Bluetooth printer.");
            }

            cachedCharacteristic = char;
        }

        // Build raw ESC/POS byte buffer
        const lines = (bill.lines || []).map((l: { quantity: number; itemName: string; lineTotal: string }) => ({
            quantity: l.quantity,
            itemName: l.itemName,
            total: Number(l.lineTotal || 0).toLocaleString(),
        }));

        const bytes = encodeReceiptToEscPos({
            restaurantName,
            branchName,
            billNumber: bill.billNumber || "N/A",
            date: bill.generatedAt
                ? new Date(bill.generatedAt).toLocaleString([], {
                      timeZone: "Africa/Addis_Ababa",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  })
                : new Date().toLocaleString([], {
                      timeZone: "Africa/Addis_Ababa",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  }),
            table: tableDisplayName || "",
            waiter: waiterName || "",
            cashier: cashierName || "",
            lines,
            total: Number(bill.total || bill.subtotal || 0).toLocaleString(),
            status: (bill.status || "PAID").toUpperCase(),
            qrData: bill.billId ? `receipt/${bill.billId}` : bill.billNumber,
            paperWidth,
        });

        // Transmit in 64-byte chunks to avoid BLE MTU overflow
        const CHUNK_SIZE = 64;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            const chunk = bytes.slice(i, i + CHUNK_SIZE);
            if (char.writeValueWithoutResponse) {
                await char.writeValueWithoutResponse(chunk);
            } else {
                await char.writeValue(chunk);
            }
            // 15ms throttle between chunks
            await new Promise(r => setTimeout(r, 15));
        }

        return true;
    }

    // Station Server Port Print (via /api/print)
    async function printViaStationApi(): Promise<boolean> {
        const res = await fetch("/api/print", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bill,
                port,
                paperWidth,
                table: tableDisplayName,
                waiter: waiterName,
                cashier: cashierName,
                restaurantName,
                branchName,
            }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
            throw new Error(data.error || "Failed to print receipt via station port");
        }
        return true;
    }

    async function handleFastPrint() {
        setPrinting(true);
        setSuccess(false);

        try {
            if (printMode === "bluetooth") {
                await printViaWebBluetooth();
                setSuccess(true);
                toast.success("Receipt Printed!", "Direct wireless Bluetooth output successful");
            } else {
                await printViaStationApi();
                setSuccess(true);
                toast.success("Receipt Printed!", `Sent to station port ${port}`);
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            
            // If Bluetooth fails on desktop, prompt fallback option
            if (printMode === "bluetooth" && (msg.includes("User cancelled") || msg.includes("not supported"))) {
                toast.info("Bluetooth Cancelled", "You can switch to Station Port mode in settings if using PC.");
            } else {
                toast.error("Print Error", msg || "Make sure the printer is turned on and paired.");
            }
        } finally {
            setPrinting(false);
        }
    }

    async function handlePairBleOnly() {
        try {
            await printViaWebBluetooth();
            toast.success("Printer Connected!", `Linked to ${bleDeviceName || "MPT-II"}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("cancelled")) {
                toast.error("Bluetooth Pair Failed", msg);
            }
        }
    }

    return (
        <>
            <div className="inline-flex rounded-lg shadow-xs">
                <Button
                    size="sm"
                    onClick={handleFastPrint}
                    disabled={printing}
                    className={`h-8 gap-1.5 rounded-r-none text-xs font-semibold ${
                        success
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white"
                    }`}
                    title={
                        printMode === "bluetooth"
                            ? `Wireless Direct Print (Bluetooth: ${bleDeviceName || "Ready"})`
                            : `Station Port Print (${port})`
                    }
                >
                    {printing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : success ? (
                        <Check className="size-3.5 text-emerald-100" />
                    ) : printMode === "bluetooth" ? (
                        <Bluetooth className="size-3.5 text-emerald-200" />
                    ) : (
                        <Printer className="size-3.5 text-emerald-200" />
                    )}
                    {printing
                        ? "Printing..."
                        : success
                        ? "Printed!"
                        : printMode === "bluetooth"
                        ? "Direct Wireless POS"
                        : "Direct POS Print"}
                </Button>

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setTempPort(port);
                        setTempMode(printMode);
                        setSettingsOpen(true);
                    }}
                    disabled={printing}
                    className="h-8 px-2 rounded-l-none border-l border-emerald-800/60 bg-emerald-700 hover:bg-emerald-800 text-white"
                    title={`Configure Printer (Mode: ${printMode.toUpperCase()})`}
                >
                    <Settings className="size-3 text-emerald-200" />
                </Button>
            </div>

            {/* Station / Bluetooth Setup Modal */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-md rounded-2xl p-5">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="size-4 text-emerald-600" />
                            Printer Connection Setup
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-3 space-y-4 text-xs text-slate-600">
                        {/* Mode Switcher */}
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                                Select Print Method for this Device:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTempMode("bluetooth")}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        tempMode === "bluetooth"
                                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                                        <Bluetooth className="size-3.5" />
                                        <span>Web Bluetooth</span>
                                    </div>
                                    <p className="text-[10px] font-normal text-slate-500">
                                        Best for Tablets, Phones, & Laptops. No apps or servers required.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTempMode("station")}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        tempMode === "station"
                                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                                        <Printer className="size-3.5" />
                                        <span>Station Port</span>
                                    </div>
                                    <p className="text-[10px] font-normal text-slate-500">
                                        Best for Cashier Counter PCs (USB or Bluetooth COM port).
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Mode Details */}
                        {tempMode === "bluetooth" ? (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <p className="text-[11px] text-slate-700 font-medium">
                                    Wireless Direct Mode connects this tablet or browser directly to your portable thermal printer.
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-slate-500">
                                        Status:{" "}
                                        <strong className="text-slate-800">
                                            {bleDeviceName ? `Linked to ${bleDeviceName}` : "Not paired yet"}
                                        </strong>
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handlePairBleOnly}
                                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Bluetooth className="size-3 mr-1" />
                                        Pair Printer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <label className="block text-[11px] font-semibold text-slate-700">
                                    Station Port Name (e.g. COM9, COM3, COM4):
                                </label>
                                <input
                                    type="text"
                                    value={tempPort}
                                    onChange={e => setTempPort(e.target.value)}
                                    placeholder="COM9"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs uppercase font-mono font-bold text-slate-900 focus:outline-emerald-600"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Saved locally for this computer station.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSettingsOpen(false)}
                            className="h-8 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSaveSettings}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                            Save Setting
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

"use client";

import React, { useState, useEffect } from "react";
import { Printer, Loader2, Check, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/button";
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
// Cache connected Serial port across prints on PC
let cachedSerialPort: any = null;

export const DirectBluetoothPrintButton: React.FC<
    DirectBluetoothPrintButtonProps
> = ({
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
    const [printMode, setPrintMode] = useState<"bluetooth" | "station">(
        "station",
    );
    const [port, setPort] = useState("COM9");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tempPort, setTempPort] = useState("COM9");
    const [tempMode, setTempMode] = useState<"bluetooth" | "station">(
        "station",
    );
    const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
    const [serialConnected, setSerialConnected] = useState(false);

    // Load saved settings from station localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPort = localStorage.getItem("pos_station_printer_port");
            const savedMode = localStorage.getItem("pos_printer_mode") as
                | "bluetooth"
                | "station";

            // Auto-detect if on mobile/tablet and Bluetooth is available
            const isMobile = /Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent,
            );
            const hasBle =
                typeof navigator !== "undefined" && "bluetooth" in navigator;

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

            // Check if a USB/Serial port was previously granted
            if (typeof navigator !== "undefined" && "serial" in navigator) {
                (navigator as any).serial
                    .getPorts()
                    .then((ports: any[]) => {
                        if (ports && ports.length > 0) {
                            cachedSerialPort = ports[0];
                            setSerialConnected(true);
                        }
                    })
                    .catch(() => {});
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
        toast.success(
            "Settings Saved",
            `Mode: ${tempMode.toUpperCase()} (${tempMode === "bluetooth" ? "Wireless" : cleanPort})`,
        );
    }

    // Direct Web Bluetooth Printer Connection & Sender (PWA / Mobile / Wireless)
    async function printViaWebBluetooth(): Promise<boolean> {
        if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
            throw new Error(
                "Web Bluetooth is not supported on this browser. Use Chrome on Android, Windows, or Mac.",
            );
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
            toast.info(
                "Pairing Printer",
                "Select your printer (e.g. MPT-II) from the list...",
            );
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
                throw new Error(
                    "Could not find printer write service on this Bluetooth device.",
                );
            }

            // Find writeable characteristic
            const chars = await targetService.getCharacteristics();
            char =
                chars.find(
                    (c: any) =>
                        c.properties.write || c.properties.writeWithoutResponse,
                ) || chars[0];

            if (!char) {
                throw new Error(
                    "No write characteristic found on Bluetooth printer.",
                );
            }

            cachedCharacteristic = char;
        }

        // Build raw ESC/POS byte buffer
        const lines = (bill.lines || []).map(
            (l: { quantity: number; itemName: string; lineTotal: string }) => ({
                quantity: l.quantity,
                itemName: l.itemName,
                total: Number(l.lineTotal || 0).toLocaleString(),
            }),
        );

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

    // Direct Web Serial Printer Connection & Sender (for PC via USB/COM)
    async function printViaWebSerial(): Promise<boolean> {
        if (typeof navigator === "undefined" || !("serial" in navigator)) {
            throw new Error(
                "Web Serial is not supported on this browser. Please use Google Chrome or Microsoft Edge on PC.",
            );
        }

        const nav = navigator as any;
        let portObj = cachedSerialPort;

        if (!portObj) {
            const grantedPorts = await nav.serial.getPorts();
            if (grantedPorts && grantedPorts.length > 0) {
                portObj = grantedPorts[0];
            } else {
                toast.info(
                    "Select Printer",
                    "Choose your USB/Serial POS printer from the list...",
                );
                portObj = await nav.serial.requestPort();
            }
            cachedSerialPort = portObj;
            setSerialConnected(true);
        }

        if (!portObj.writable) {
            await portObj.open({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: "none",
            });
        }

        const lines = (bill.lines || []).map(
            (l: { quantity: number; itemName: string; lineTotal: string }) => ({
                quantity: l.quantity,
                itemName: l.itemName,
                total: Number(l.lineTotal || 0).toLocaleString(),
            }),
        );

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

        try {
            const writer = portObj.writable.getWriter();
            try {
                await writer.write(bytes);
            } finally {
                writer.releaseLock();
            }
        } catch (writeErr: any) {
            // If writer failed due to broken pipe/stale port, retry once with fresh port connection
            cachedSerialPort = null;
            setSerialConnected(false);
            try {
                await portObj.close();
            } catch {}
            const granted = await nav.serial.getPorts();
            if (granted && granted.length > 0) {
                portObj = granted[0];
                await portObj.open({
                    baudRate: 9600,
                    dataBits: 8,
                    stopBits: 1,
                    parity: "none",
                });
                cachedSerialPort = portObj;
                setSerialConnected(true);
                const retryWriter = portObj.writable.getWriter();
                try {
                    await retryWriter.write(bytes);
                } finally {
                    retryWriter.releaseLock();
                }
            } else {
                throw writeErr;
            }
        }

        return true;
    }

    // Station Server Port Print (via /api/print fallback)
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
            throw new Error(
                data.error || "Failed to print receipt via station port",
            );
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
                toast.success(
                    "Receipt Printed!",
                    "Direct wireless Bluetooth output successful",
                );
            } else {
                // Station PC Mode: prefer client-side Web Serial on PC
                if (typeof navigator !== "undefined" && "serial" in navigator) {
                    await printViaWebSerial();
                    setSuccess(true);
                    toast.success(
                        "Receipt Printed!",
                        "Direct USB/Serial output successful",
                    );
                } else {
                    await printViaStationApi();
                    setSuccess(true);
                    toast.success(
                        "Receipt Printed!",
                        `Sent to station port ${port}`,
                    );
                }
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);

            // If Bluetooth fails on desktop, prompt fallback option
            if (
                printMode === "bluetooth" &&
                (msg.includes("User cancelled") ||
                    msg.includes("not supported"))
            ) {
                toast.info(
                    "Bluetooth Cancelled",
                    "You can switch to Station Port mode in settings if using PC.",
                );
            } else {
                toast.error(
                    "Print Error",
                    msg || "Make sure the printer is turned on and paired.",
                );
            }
        } finally {
            setPrinting(false);
        }
    }

    async function handlePairBleOnly() {
        try {
            await printViaWebBluetooth();
            toast.success(
                "Printer Connected!",
                `Linked to ${bleDeviceName || "MPT-II"}`,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("cancelled")) {
                toast.error("Bluetooth Pair Failed", msg);
            }
        }
    }

    async function handlePairSerialOnly() {
        try {
            if (typeof navigator === "undefined" || !("serial" in navigator)) {
                toast.error(
                    "Not Supported",
                    "Web Serial requires Google Chrome or Microsoft Edge on PC.",
                );
                return;
            }
            const nav = navigator as any;
            const selected = await nav.serial.requestPort();
            cachedSerialPort = selected;
            setSerialConnected(true);
            toast.success(
                "Printer Connected!",
                "USB/Serial printer paired successfully.",
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (
                !msg.includes("cancelled") &&
                !msg.includes("No port selected")
            ) {
                toast.error("Pair Failed", msg);
            }
        }
    }

    return (
        <>
            <Button
                size="sm"
                onClick={handleFastPrint}
                disabled={printing}
                className={`h-8 gap-1.5 rounded-lg text-xs font-semibold ${
                    success
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-emerald-700 hover:bg-emerald-800 text-white"
                }`}
                title={
                    printMode === "bluetooth"
                        ? `Wireless Direct Print (Bluetooth: ${bleDeviceName || "Ready"})`
                        : `Station Port Print (${serialConnected ? "USB Ready" : port})`
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
        </>
    );
};

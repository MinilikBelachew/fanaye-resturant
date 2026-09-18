"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCodeSvg } from "@/components/common/QrCodeSvg";
import { AdminTableQrItem, QrMenuConfig } from "@/context/services/qrMenuApi";
import {
    exportElementToPdf,
    exportElementsToMultiPagePdf,
} from "@/lib/pdfExport";
import {
    Download,
    FileDown,
    Layers,
    Loader2,
    Palette,
    QrCode,
    Scissors,
    Sparkles,
    Wifi,
    X,
} from "lucide-react";
import { toast } from "@/lib/toast";

interface TableQrCardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: AdminTableQrItem[];
    config: QrMenuConfig;
    restaurantName?: string;
    slug: string;
}

type CardLayout = "tent" | "compact" | "large";
type ColorTheme = "amber" | "monochrome" | "dark";

export const TableQrCardModal: React.FC<TableQrCardModalProps> = ({
    open,
    onOpenChange,
    tables,
    config,
    restaurantName = "Your Restaurant",
    slug,
}) => {
    const [selectedLocation, setSelectedLocation] = useState<string>("all");
    const [layout, setLayout] = useState<CardLayout>("tent");
    const [theme, setTheme] = useState<ColorTheme>("amber");
    const [showWifi, setShowWifi] = useState<boolean>(true);
    const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
    const [instructionHeadline, setInstructionHeadline] = useState<string>(
        "Scan with your Camera to Order",
    );
    const [activePrintingTableId, setActivePrintingTableId] = useState<
        string | null
    >(null);
    const [customOrigin, setCustomOrigin] = useState<string>("");
    const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
    const cardsContainerRef = useRef<HTMLDivElement>(null);

    const defaultOrigin =
        typeof window !== "undefined"
            ? window.location.origin
            : "https://example.com";
    const origin = (customOrigin.trim() || defaultOrigin).replace(/\/+$/, "");

    const locations = Array.from(
        new Set(tables.map(t => t.locationName || "Main Hall")),
    );

    const filteredTables = tables.filter(
        t =>
            (selectedLocation === "all" ||
                (t.locationName || "Main Hall") === selectedLocation) &&
            (!activePrintingTableId || t.id === activePrintingTableId),
    );

    const cardsPerPage = layout === "large" ? 1 : layout === "compact" ? 4 : 2;
    const tablePages = React.useMemo(() => {
        const pages: AdminTableQrItem[][] = [];
        for (let i = 0; i < filteredTables.length; i += cardsPerPage) {
            pages.push(filteredTables.slice(i, i + cardsPerPage));
        }
        return pages;
    }, [filteredTables, cardsPerPage]);

    async function handleExportPdf() {
        setIsExportingPdf(true);
        try {
            const pageElements =
                document.querySelectorAll<HTMLElement>(".qr-pdf-page-sheet");
            const pdfOrientation = layout === "tent" ? "landscape" : "portrait";
            if (pageElements.length > 0) {
                await exportElementsToMultiPagePdf(Array.from(pageElements), {
                    filename: `${slug}-all-table-qr-stand-cards.pdf`,
                    orientation: pdfOrientation,
                    scale: 2.5,
                });
            } else if (cardsContainerRef.current) {
                await exportElementToPdf(cardsContainerRef.current, {
                    filename: `${slug}-all-table-qr-stand-cards.pdf`,
                    orientation: pdfOrientation,
                    scale: 2.5,
                });
            }
        } finally {
            setIsExportingPdf(false);
        }
    }

    async function handlePrintSingle(tableId: string) {
        const cardEl = document.getElementById(`qr-card-${tableId}`);
        if (cardEl) {
            const table = tables.find(t => t.id === tableId);
            const name = table
                ? table.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")
                : tableId;
            setIsExportingPdf(true);
            try {
                await exportElementToPdf(cardEl, {
                    filename: `${slug}-table-${name}-qr-card.pdf`,
                    scale: 2.5,
                });
            } finally {
                setIsExportingPdf(false);
            }
        } else {
            handleExportPdf();
        }
    }

    function downloadSvg(table: AdminTableQrItem) {
        const svgEl = document.getElementById(`qr-svg-${table.id}`);
        if (!svgEl) {
            toast.error("Could not find QR element");
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${slug}-${table.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(
            "QR Code downloaded",
            `${table.displayName} SVG vector downloaded.`,
        );
    }

    function downloadAllSvgs() {
        if (filteredTables.length === 0) return;
        toast.info(
            "Downloading all SVGs",
            `Downloading ${filteredTables.length} QR vector files...`,
        );
        filteredTables.forEach((table, index) => {
            setTimeout(() => {
                downloadSvg(table);
            }, index * 200);
        });
    }

    const renderCard = (table: AdminTableQrItem, isInteractive = true) => {
        const qrUrl = `${origin}/r/${slug}/t/${table.id}`;

        // Theme Styling Classes
        const themeCardBg =
            theme === "monochrome"
                ? "bg-white text-slate-950 border-2 border-black print:border-black"
                : theme === "dark"
                  ? "bg-slate-900 text-white border-2 border-slate-700 print:bg-slate-900 print:text-white"
                  : "bg-gradient-to-b from-white via-white to-amber-50/50 text-slate-900 border-2 border-slate-200 print:border-slate-800";

        const qrFgColor =
            theme === "monochrome"
                ? "#000000"
                : theme === "dark"
                  ? "#0f172a"
                  : "#0f172a";

        const qrSize =
            layout === "large" ? 220 : layout === "compact" ? 140 : 180;

        return (
            <div
                key={table.id}
                id={isInteractive ? `qr-card-${table.id}` : undefined}
                className={`print-card-break relative flex flex-col items-center justify-between rounded-3xl p-6 text-center shadow-xs transition-shadow hover:shadow-md ${themeCardBg} ${
                    showCutGuides
                        ? "print:border-dashed print:border-slate-400"
                        : ""
                } ${!isInteractive ? "h-full" : ""}`}
            >
                {/* Individual Card Controls (hidden in print and offscreen export) */}
                {isInteractive ? (
                    <div className="no-print absolute top-3 right-3 flex items-center gap-1.5">
                        <button
                            onClick={() => downloadSvg(table)}
                            className="flex size-7 items-center justify-center rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                            title="Download SVG Vector"
                        >
                            <Download className="size-3.5" />
                        </button>
                        <button
                            onClick={() => handlePrintSingle(table.id)}
                            className="flex size-7 items-center justify-center rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                            title="Export PDF For This Card"
                        >
                            <FileDown className="size-3.5 text-amber-600" />
                        </button>
                    </div>
                ) : null}

                {/* Brand Header */}
                <div className="w-full">
                    <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                            theme === "monochrome"
                                ? "bg-black text-white"
                                : theme === "dark"
                                  ? "bg-white/10 text-amber-400"
                                  : "bg-amber-600/10 text-amber-800"
                        }`}
                    >
                        <Sparkles className="size-3 text-amber-500" />
                        {restaurantName}
                    </div>
                    <h3
                        className={`mt-2 text-2xl font-black tracking-tight ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    >
                        {table.displayName}
                    </h3>
                    <p
                        className={`text-xs font-semibold ${
                            theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        {table.locationName || "Dining Floor"}
                    </p>
                </div>

                {/* QR Code Container */}
                <div className="my-5 rounded-2xl bg-white p-3 shadow-inner ring-1 ring-slate-200/80 print:shadow-none">
                    <QrCodeSvg
                        id={isInteractive ? `qr-svg-${table.id}` : undefined}
                        value={qrUrl}
                        size={qrSize}
                        fgColor={qrFgColor}
                    />
                </div>

                {/* Bottom Instructions */}
                <div
                    className={`w-full border-t pt-3.5 ${
                        theme === "dark"
                            ? "border-slate-800"
                            : "border-slate-200/80"
                    }`}
                >
                    <p
                        className={`text-xs sm:text-sm font-black ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    >
                        {instructionHeadline}
                    </p>
                    <p
                        className={`mt-0.5 text-[10px] sm:text-[11px] ${
                            theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        Instant Kitchen Dispatch · Contactless Service
                    </p>

                    {/* Clean readable URL for diners and verification */}
                    <p className="mt-2 text-[9px] font-mono text-slate-400 select-all truncate max-w-[240px] mx-auto">
                        {qrUrl.replace(/^https?:\/\//, "")}
                    </p>

                    {/* Wi-Fi Info */}
                    {showWifi && config.wifiSsid ? (
                        <div
                            className={`mt-3 flex items-center justify-center gap-3 rounded-xl px-3 py-1.5 text-[11px] border ${
                                theme === "dark"
                                    ? "bg-slate-800/80 text-white border-slate-700"
                                    : "bg-slate-100/90 text-slate-800 border-slate-200/60"
                            }`}
                        >
                            <span className="flex items-center gap-1 font-bold">
                                <Wifi className="size-3 text-amber-500" />
                                WiFi: {config.wifiSsid}
                            </span>
                            {config.wifiPassword ? (
                                <span className="font-mono text-slate-600 dark:text-slate-300">
                                    Pass:{" "}
                                    <strong
                                        className={
                                            theme === "dark"
                                                ? "text-white"
                                                : "text-slate-900"
                                        }
                                    >
                                        {config.wifiPassword}
                                    </strong>
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {/* Print-only cut marks indicator if enabled */}
                {showCutGuides ? (
                    <div className="hidden print:block absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 tracking-wider">
                        ✂ CUT HERE
                    </div>
                ) : null}
            </div>
        );
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
            {/* Dynamic Print Styles for Flawless PDF Export & Paper Layouts */}
            <style jsx global>{`
                @page {
                    size: auto;
                    margin: 8mm;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-qr-modal,
                    #printable-qr-modal * {
                        visibility: visible;
                    }
                    #printable-qr-modal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-card-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>

            <div
                id="printable-qr-modal"
                className="relative flex max-h-[94vh] w-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden print:m-0 print:max-h-none print:w-full print:rounded-none print:shadow-none"
            >
                {/* Modal Toolbar (hidden when printing) */}
                <div className="no-print border-b border-slate-100 bg-slate-50/80 p-5 space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                <QrCode className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Table QR Stand Cards & PDF Export
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Ready-to-print acrylic stand cards and
                                    high-res vector PDFs (
                                    {filteredTables.length} tables).
                                </p>
                            </div>
                        </div>

                        {/* Print, Export & Close Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                onClick={handleExportPdf}
                                disabled={isExportingPdf}
                                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
                            >
                                {isExportingPdf ? (
                                    <Loader2 className="size-4 animate-spin text-white" />
                                ) : (
                                    <FileDown className="size-4" />
                                )}
                                {isExportingPdf
                                    ? "Generating PDF…"
                                    : "Export to PDF"}
                            </Button>

                            <Button
                                onClick={downloadAllSvgs}
                                variant="outline"
                                className="gap-1.5 border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                                title="Download all table QR SVGs"
                            >
                                <Download className="size-3.5 text-amber-600" />
                                Download SVGs
                            </Button>

                            <button
                                onClick={() => onOpenChange(false)}
                                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Print Options & Customization Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-3 text-xs">
                        {/* Card Layout Selector */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-500 text-[11px] font-semibold mr-1 flex items-center gap-1">
                                <Layers className="size-3 text-slate-400" />{" "}
                                Card Size:
                            </span>
                            {[
                                { id: "tent", label: "Tent Stand (2/page)" },
                                {
                                    id: "compact",
                                    label: "Compact Badge (4/page)",
                                },
                                {
                                    id: "large",
                                    label: "Plaque Display (1/page)",
                                },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() =>
                                        setLayout(opt.id as CardLayout)
                                    }
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                        layout === opt.id
                                            ? "bg-amber-600 text-white"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Color Theme Selector */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-500 text-[11px] font-semibold mr-1 flex items-center gap-1">
                                <Palette className="size-3 text-slate-400" />{" "}
                                Color Theme:
                            </span>
                            {[
                                { id: "amber", label: "Warm Amber" },
                                {
                                    id: "monochrome",
                                    label: "Black & White (Ink-Saver)",
                                },
                                { id: "dark", label: "Dark Slate Plaque" },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() =>
                                        setTheme(opt.id as ColorTheme)
                                    }
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                        theme === opt.id
                                            ? "bg-slate-900 text-white"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Quick Toggles: Wi-Fi, Cut Guides */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowWifi(!showWifi)}
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                                    showWifi
                                        ? "border-amber-500/50 bg-amber-50 text-amber-900"
                                        : "border-slate-200 bg-white text-slate-400"
                                }`}
                            >
                                <Wifi className="size-3" />
                                {showWifi ? "Wi-Fi: On" : "Wi-Fi: Off"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowCutGuides(!showCutGuides)}
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                                    showCutGuides
                                        ? "border-slate-400 bg-slate-100 text-slate-800"
                                        : "border-slate-200 bg-white text-slate-400"
                                }`}
                                title="Print dotted crop guides for scissors or trimmer"
                            >
                                <Scissors className="size-3" />
                                {showCutGuides
                                    ? "Cut Lines: On"
                                    : "Cut Lines: Off"}
                            </button>
                        </div>
                    </div>

                    {/* Floor filter & Custom instruction line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50 pt-2.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-400 text-[11px] font-medium mr-1">
                                Floor:
                            </span>
                            <button
                                onClick={() => setSelectedLocation("all")}
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                                    selectedLocation === "all"
                                        ? "bg-slate-900 text-white"
                                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                                All Floors ({tables.length})
                            </button>
                            {locations.map(loc => (
                                <button
                                    key={loc}
                                    onClick={() => setSelectedLocation(loc)}
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                                        selectedLocation === loc
                                            ? "bg-slate-900 text-white"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>

                        {/* Instruction Preset & Target Host */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                    QR Link Host:
                                </span>
                                <input
                                    type="text"
                                    value={customOrigin}
                                    placeholder={defaultOrigin}
                                    onChange={e =>
                                        setCustomOrigin(e.target.value)
                                    }
                                    className="w-44 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    title="To test from your phone on the same Wi-Fi, enter your computer IP (e.g. http://192.168.1.50:3000)"
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                    Headline:
                                </span>
                                <select
                                    value={instructionHeadline}
                                    onChange={e =>
                                        setInstructionHeadline(e.target.value)
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    <option value="Scan with your Camera to Order">
                                        Scan with your Camera to Order
                                    </option>
                                    <option value="Order & Pay Directly from Table">
                                        Order & Pay Directly from Table
                                    </option>
                                    <option value="Browse Food Menu & Specials">
                                        Browse Food Menu & Specials
                                    </option>
                                    <option value="Contactless Guest Self-Service">
                                        Contactless Guest Self-Service
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informative Tip banner for PDF export */}
                <div className="no-print bg-amber-500/10 px-6 py-2 border-b border-amber-500/20 text-[11px] text-amber-900 flex flex-wrap items-center justify-between gap-2">
                    <span>
                        ⚡ <strong>Instant PDF Export:</strong> Click{" "}
                        <em>&ldquo;Export to PDF&rdquo;</em> to download a
                        high-resolution vector PDF directly to your device via
                        jsPDF without opening the print dialog.
                    </span>
                    {activePrintingTableId ? (
                        <button
                            onClick={() => setActivePrintingTableId(null)}
                            className="text-amber-800 underline font-bold"
                        >
                            Reset to all tables
                        </button>
                    ) : null}
                </div>

                {/* Cards Grid (Interactive Screen Preview) */}
                <div
                    ref={cardsContainerRef}
                    className={`flex-1 overflow-y-auto p-6 grid gap-6 print:p-4 bg-white ${
                        layout === "large"
                            ? "grid-cols-1 max-w-xl mx-auto print:max-w-none print:grid-cols-1"
                            : layout === "compact"
                              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-4"
                              : "grid-cols-1 sm:grid-cols-2 print:grid-cols-2 print:gap-6"
                    }`}
                >
                    {filteredTables.map(table => renderCard(table, true))}
                </div>

                {/* Offscreen Dedicated A4 Print Sheets Container for Complete Multi-Page PDF Export (All tables) */}
                {(() => {
                    const isLandscape = layout === "tent";
                    const sheetWidthMm = isLandscape ? 297 : 210;
                    const sheetHeightMm = isLandscape ? 210 : 297;

                    return (
                        <div
                            id="qr-cards-pdf-print-container"
                            className="no-print"
                            style={{
                                position: "fixed",
                                left: "-99999px",
                                top: 0,
                                width: `${sheetWidthMm}mm`,
                                pointerEvents: "none",
                                zIndex: -1,
                            }}
                        >
                            {tablePages.map((pageTables, pageIdx) => (
                                <div
                                    key={`export-page-${pageIdx}`}
                                    className="qr-pdf-page-sheet"
                                    style={{
                                        width: `${sheetWidthMm}mm`,
                                        height: `${sheetHeightMm}mm`,
                                        padding: isLandscape
                                            ? "10mm 14mm"
                                            : "14mm 10mm",
                                        backgroundColor: "#ffffff",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div
                                        className={`w-full h-full ${
                                            layout === "large"
                                                ? "flex items-center justify-center"
                                                : layout === "compact"
                                                  ? "grid grid-cols-2 grid-rows-2 gap-4"
                                                  : "grid grid-cols-2 gap-8 items-stretch"
                                        }`}
                                    >
                                        {pageTables.map(table =>
                                            renderCard(table, false),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

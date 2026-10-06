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
    Scissors,
    Sparkles,
    Wifi,
    X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useTranslations } from "next-intl";

interface TableQrCardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tables: AdminTableQrItem[];
    config: QrMenuConfig;
    restaurantName?: string;
    slug: string;
    /** When true, show branch in filters / screen-only labels (never on print). */
    managesAllBranches?: boolean;
}

type CardLayout = "tent" | "compact" | "large";
type ColorTheme = "amber" | "monochrome" | "dark";
const HEADLINE_KEYS = {
    scan: "headlineScan",
    orderPay: "headlineOrderPay",
    browse: "headlineBrowse",
    contactless: "headlineContactless",
} as const;

type HeadlineId = keyof typeof HEADLINE_KEYS;

export const TableQrCardModal: React.FC<TableQrCardModalProps> = ({
    open,
    onOpenChange,
    tables,
    config,
    restaurantName = "Your Restaurant",
    slug,
    managesAllBranches = false,
}) => {
    const t = useTranslations("qrMenuStudio");
    const [selectedLocation, setSelectedLocation] = useState<string>("all");
    const [layout, setLayout] = useState<CardLayout>("tent");
    const [theme, setTheme] = useState<ColorTheme>("amber");
    const [showWifi, setShowWifi] = useState<boolean>(() =>
        Boolean(config.wifiSsid?.trim()),
    );
    const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
    const hasWifiCredentials = Boolean(config.wifiSsid?.trim());
    const [instructionHeadline, setInstructionHeadline] =
        useState<HeadlineId>("scan");
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

    const showBranchInUi =
        managesAllBranches ||
        tables.some(table => Boolean(table.branchName?.trim()));

    function floorKeyFor(table: AdminTableQrItem) {
        const loc = table.locationName || "Main Hall";
        if (showBranchInUi && table.branchName) {
            return `${table.branchName} · ${loc}`;
        }
        return loc;
    }

    const locations = Array.from(new Set(tables.map(floorKeyFor)));

    const filteredTables = tables.filter(t => {
        return (
            (selectedLocation === "all" ||
                floorKeyFor(t) === selectedLocation) &&
            (!activePrintingTableId || t.id === activePrintingTableId)
        );
    });

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
                            title={t("downloadSvgTitle")}
                        >
                            <Download className="size-3.5" />
                        </button>
                        <button
                            onClick={() => handlePrintSingle(table.id)}
                            className="flex size-7 items-center justify-center rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                            title={t("exportPdfCardTitle")}
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
                        {table.locationName || t("diningFloor")}
                    </p>
                    {/* Manager-only: branch label on screen, never in PDF/print */}
                    {isInteractive && showBranchInUi && table.branchName ? (
                        <p className="no-print mt-1 text-[10px] font-medium text-muted-foreground">
                            {table.branchName}
                        </p>
                    ) : null}
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
                        {t(HEADLINE_KEYS[instructionHeadline])}
                    </p>
                    <p
                        className={`mt-0.5 text-[10px] sm:text-[11px] ${
                            theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                        }`}
                    >
                        {t("instantDispatch")}
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
                                {t("wifiPrefix")} {config.wifiSsid}
                            </span>
                            {config.wifiPassword ? (
                                <span className="font-mono text-slate-600 dark:text-slate-300">
                                    {t("passPrefix")}{" "}
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
                        ✂ {t("cutHere")}
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
                className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl print:m-0 print:max-h-none print:w-full print:rounded-none print:border-0 print:shadow-none"
            >
                {/* Modal Toolbar (hidden when printing) */}
                <div className="no-print space-y-4 border-b border-border p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-[15px] font-semibold text-foreground">
                                {t("modalTitle")}
                            </h3>
                            <p className="mt-0.5 text-[12px] text-muted-foreground">
                                {t("modalSubtitle", {
                                    count: filteredTables.length,
                                })}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                                size="sm"
                                onClick={handleExportPdf}
                                disabled={isExportingPdf}
                                className="gap-1.5 shadow-none"
                            >
                                {isExportingPdf ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <FileDown className="size-3.5" />
                                )}
                                {isExportingPdf
                                    ? t("generatingPdf")
                                    : t("exportPdf")}
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadAllSvgs}
                                className="gap-1.5 shadow-none"
                            >
                                <Download className="size-3.5" />
                                {t("downloadSvgs")}
                            </Button>

                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Layers className="size-3" />
                                {t("cardSize")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {(
                                    [
                                        { id: "tent", labelKey: "sizeTent" },
                                        {
                                            id: "compact",
                                            labelKey: "sizeCompact",
                                        },
                                        {
                                            id: "large",
                                            labelKey: "sizePlaque",
                                        },
                                    ] as const
                                ).map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            setLayout(opt.id as CardLayout)
                                        }
                                        className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                            layout === opt.id
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {t(opt.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Palette className="size-3" />
                                {t("colorTheme")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {(
                                    [
                                        { id: "amber", labelKey: "themeAmber" },
                                        {
                                            id: "monochrome",
                                            labelKey: "themeMono",
                                        },
                                        { id: "dark", labelKey: "themeDark" },
                                    ] as const
                                ).map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() =>
                                            setTheme(opt.id as ColorTheme)
                                        }
                                        className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                            theme === opt.id
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {t(opt.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">
                                {t("floor")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLocation("all")}
                                    className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                        selectedLocation === "all"
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {t("allFloors", { count: tables.length })}
                                </button>
                                {locations.map(loc => (
                                    <button
                                        key={loc}
                                        type="button"
                                        onClick={() => setSelectedLocation(loc)}
                                        className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                            selectedLocation === loc
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">
                                {t("qrLinkHost")}
                            </p>
                            <input
                                type="text"
                                value={customOrigin}
                                placeholder={defaultOrigin}
                                onChange={e => setCustomOrigin(e.target.value)}
                                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                title="For phone testing on the same Wi-Fi, use your computer IP (e.g. http://192.168.1.50:3000)"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">
                                {t("headline")}
                            </p>
                            <select
                                value={instructionHeadline}
                                onChange={e =>
                                    setInstructionHeadline(
                                        e.target.value as HeadlineId,
                                    )
                                }
                                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                            >
                                {(
                                    Object.keys(HEADLINE_KEYS) as HeadlineId[]
                                ).map(id => (
                                    <option key={id} value={id}>
                                        {t(HEADLINE_KEYS[id])}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-[11px] text-muted-foreground">
                                Options
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {hasWifiCredentials ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowWifi(!showWifi)}
                                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                            showWifi
                                                ? "border-foreground bg-foreground text-background"
                                                : "border-border text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Wifi className="size-3" />
                                        {showWifi ? t("wifiOn") : t("wifiOff")}
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCutGuides(!showCutGuides)
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                                        showCutGuides
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Scissors className="size-3" />
                                    {showCutGuides
                                        ? t("cutLinesOn")
                                        : t("cutLinesOff")}
                                </button>
                                {activePrintingTableId ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActivePrintingTableId(null)
                                        }
                                        className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                                    >
                                        {t("resetAllTables")}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
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

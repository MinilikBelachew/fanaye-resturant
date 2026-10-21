"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import { useLocale } from "next-intl";
import {
    type CalendarMode,
    ETHIOPIAN_DAYS,
    ETHIOPIAN_MONTHS,
    ethiopianToGregorianDate,
    formatDateRangeLabel,
    formatToYmd,
    getDaysInEthiopianMonth,
    getEthiopianDateDetails,
    getSavedCalendarMode,
    parseYmdToLocalDate,
    setSavedCalendarMode,
} from "@/lib/ethiopian-calendar";
import { cn } from "@/lib/utils";

export type DatePickerSelectionMode = "single" | "range";

export interface DualCalendarDatePickerProps {
    /** Gregorian YYYY-MM-DD */
    from?: string;
    /** Gregorian YYYY-MM-DD */
    to?: string;
    onApply: (dates: { from: string; to: string }) => void;
    onClear?: () => void;
    className?: string;
    /** Start in single-day or range. Default: inferred from from/to. */
    defaultSelectionMode?: DatePickerSelectionMode;
    /** Hide single/range toggle (force one mode). */
    selectionMode?: DatePickerSelectionMode;
    applyLabel?: string;
    clearLabel?: string;
    /**
     * `inline` — normal flow.
     * `popover` — floats above content (absolute + high z-index). Parent should be `relative`.
     */
    variant?: "inline" | "popover";
    /** Called when backdrop is clicked (popover only). */
    onDismiss?: () => void;
}

type EthCursor = { year: number; month: number };
type GregCursor = { year: number; month: number }; // month 0-11

function gregCursorFromYmd(ymd: string): GregCursor {
    const d = parseYmdToLocalDate(ymd);
    return { year: d.getFullYear(), month: d.getMonth() };
}

function ethCursorFromYmd(ymd: string): EthCursor {
    const e = getEthiopianDateDetails(parseYmdToLocalDate(ymd));
    return { year: e.year, month: e.month };
}

function shiftGregMonth(c: GregCursor, delta: number): GregCursor {
    const d = new Date(c.year, c.month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
}

function shiftEthMonth(c: EthCursor, delta: number): EthCursor {
    let { year, month } = c;
    month += delta;
    while (month > 13) {
        month -= 13;
        year += 1;
    }
    while (month < 1) {
        month += 13;
        year -= 1;
    }
    return { year, month };
}

function daysInGregMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function inRange(ymd: string, from: string, to: string): boolean {
    if (!from || !to) return false;
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    return ymd >= lo && ymd <= hi;
}

export default function DualCalendarDatePicker({
    from,
    to,
    onApply,
    onClear,
    className,
    defaultSelectionMode,
    selectionMode: forcedMode,
    applyLabel,
    clearLabel,
    variant = "inline",
    onDismiss,
}: DualCalendarDatePickerProps) {
    const isPopover = variant === "popover";
    const locale = useLocale();
    const isAmharic = locale === "am";
    const todayYmd = useMemo(() => formatToYmd(new Date()), []);

    const [calendarMode, setCalendarMode] = useState<CalendarMode>("ETHIOPIAN");
    const [selectionMode, setSelectionMode] = useState<DatePickerSelectionMode>(
        () =>
            forcedMode ??
            defaultSelectionMode ??
            (from && to && from !== to ? "range" : "single"),
    );
    const [draftFrom, setDraftFrom] = useState(from || todayYmd);
    const [draftTo, setDraftTo] = useState(to || from || todayYmd);
    const [rangePickStep, setRangePickStep] = useState<"from" | "to">("from");

    const [gregCursor, setGregCursor] = useState<GregCursor>(() =>
        gregCursorFromYmd(from || todayYmd),
    );
    const [ethCursor, setEthCursor] = useState<EthCursor>(() =>
        ethCursorFromYmd(from || todayYmd),
    );

    useEffect(() => {
        setCalendarMode(getSavedCalendarMode());
        const onMode = (e: Event) => {
            const detail = (e as CustomEvent<CalendarMode>).detail;
            if (detail) setCalendarMode(detail);
        };
        window.addEventListener("calendar_mode_changed", onMode);
        return () =>
            window.removeEventListener("calendar_mode_changed", onMode);
    }, []);

    useEffect(() => {
        if (forcedMode) setSelectionMode(forcedMode);
    }, [forcedMode]);

    useEffect(() => {
        if (from) setDraftFrom(from);
        if (to) setDraftTo(to);
        if (from) {
            setGregCursor(gregCursorFromYmd(from));
            setEthCursor(ethCursorFromYmd(from));
        }
        if (!forcedMode && from && to && from !== to) {
            setSelectionMode("range");
        }
    }, [from, to, forcedMode]);

    const setMode = (mode: CalendarMode) => {
        setCalendarMode(mode);
        setSavedCalendarMode(mode);
    };

    const labelFrom =
        selectionMode === "single"
            ? draftFrom
            : draftFrom <= draftTo
              ? draftFrom
              : draftTo;
    const labelTo =
        selectionMode === "single"
            ? draftFrom
            : draftFrom <= draftTo
              ? draftTo
              : draftFrom;
    const primaryLabel = formatDateRangeLabel(
        labelFrom,
        labelTo,
        calendarMode,
        isAmharic,
    );
    const secondaryLabel = formatDateRangeLabel(
        labelFrom,
        labelTo,
        calendarMode === "ETHIOPIAN" ? "GREGORIAN" : "ETHIOPIAN",
        calendarMode === "ETHIOPIAN" ? false : isAmharic,
    );

    const pickDay = (ymd: string) => {
        if (selectionMode === "single") {
            setDraftFrom(ymd);
            setDraftTo(ymd);
            return;
        }
        if (rangePickStep === "from" || !draftFrom) {
            setDraftFrom(ymd);
            setDraftTo(ymd);
            setRangePickStep("to");
            return;
        }
        setDraftTo(ymd);
        setRangePickStep("from");
    };

    const apply = () => {
        if (!draftFrom) return;
        if (selectionMode === "single") {
            onApply({ from: draftFrom, to: draftFrom });
            return;
        }
        if (!draftTo) return;
        const [lo, hi] =
            draftFrom <= draftTo ? [draftFrom, draftTo] : [draftTo, draftFrom];
        onApply({ from: lo, to: hi });
    };

    const pickPresetDay = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() - offset);
        const ymd = formatToYmd(d);
        setDraftFrom(ymd);
        setDraftTo(ymd);
        setGregCursor(gregCursorFromYmd(ymd));
        setEthCursor(ethCursorFromYmd(ymd));
    };

    const pickPresetRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        const fromYmd = formatToYmd(start);
        const toYmd = formatToYmd(end);
        setDraftFrom(fromYmd);
        setDraftTo(toYmd);
        setGregCursor(gregCursorFromYmd(fromYmd));
        setEthCursor(ethCursorFromYmd(fromYmd));
        setRangePickStep("from");
    };

    const weekdays = ETHIOPIAN_DAYS.map(d =>
        isAmharic ? d.shortAm : d.shortEn,
    );

    const gregCells = useMemo(() => {
        const { year, month } = gregCursor;
        const first = new Date(year, month, 1);
        const lead = (first.getDay() + 6) % 7;
        const total = daysInGregMonth(year, month);
        const cells: Array<{ ymd: string; day: number; inMonth: boolean }> = [];
        for (let i = 0; i < lead; i++) {
            cells.push({ ymd: "", day: 0, inMonth: false });
        }
        for (let day = 1; day <= total; day++) {
            const ymd = formatToYmd(new Date(year, month, day, 12));
            cells.push({ ymd, day, inMonth: true });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ ymd: "", day: 0, inMonth: false });
        }
        return cells;
    }, [gregCursor]);

    const ethCells = useMemo(() => {
        const { year, month } = ethCursor;
        const firstG = ethiopianToGregorianDate(year, month, 1);
        const lead = (firstG.getDay() + 6) % 7;
        const total = getDaysInEthiopianMonth(year, month);
        const cells: Array<{ ymd: string; day: number; inMonth: boolean }> = [];
        for (let i = 0; i < lead; i++) {
            cells.push({ ymd: "", day: 0, inMonth: false });
        }
        for (let day = 1; day <= total; day++) {
            const ymd = formatToYmd(ethiopianToGregorianDate(year, month, day));
            cells.push({ ymd, day, inMonth: true });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ ymd: "", day: 0, inMonth: false });
        }
        return cells;
    }, [ethCursor]);

    const cells = calendarMode === "ETHIOPIAN" ? ethCells : gregCells;

    const monthTitle =
        calendarMode === "ETHIOPIAN"
            ? (() => {
                  const m =
                      ETHIOPIAN_MONTHS.find(x => x.id === ethCursor.month) ??
                      ETHIOPIAN_MONTHS[0];
                  return isAmharic
                      ? `${m.nameAm} ${ethCursor.year} ዓ.ም.`
                      : `${m.nameEn} ${ethCursor.year} E.C.`;
              })()
            : new Date(gregCursor.year, gregCursor.month, 1).toLocaleDateString(
                  isAmharic ? "am-ET" : "en-US",
                  { month: "long", year: "numeric" },
              );

    const rangeFrom = draftFrom;
    const rangeHi =
        selectionMode === "single" ? draftFrom : draftTo || draftFrom;

    const dayButtonClass = (ymd: string) => {
        if (!ymd) return "invisible pointer-events-none";
        const selected =
            ymd === rangeFrom ||
            ymd === rangeHi ||
            (selectionMode === "single" && ymd === draftFrom);
        const mid =
            selectionMode === "range" &&
            draftFrom &&
            draftTo &&
            inRange(ymd, draftFrom, draftTo) &&
            !selected;
        const isToday = ymd === todayYmd;
        return cn(
            "relative flex h-7 w-full items-center justify-center rounded-md text-[11px] font-medium transition-colors",
            mid && "bg-primary/10 text-foreground rounded-none",
            selected &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            !selected && !mid && "text-foreground hover:bg-secondary/80",
            isToday && !selected && "ring-1 ring-primary/35",
        );
    };

    const panel = (
        <div
            className={cn(
                "w-[min(26rem,calc(100vw-1.5rem))] rounded-xl border border-hairline bg-card p-2.5",
                isPopover &&
                    "relative z-[80] shadow-xl ring-1 ring-black/5 dark:ring-white/10",
                className,
            )}
            role={isPopover ? "dialog" : undefined}
        >
            <div className="flex flex-wrap items-center justify-between gap-1">
                {!forcedMode ? (
                    <div className="flex rounded-md border border-hairline bg-secondary/40 p-px">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectionMode("single");
                                setDraftTo(draftFrom);
                            }}
                            className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                                selectionMode === "single"
                                    ? "bg-card font-semibold text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <CalendarDays className="size-3" />
                            {isAmharic ? "ቀን" : "Day"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectionMode("range");
                                setRangePickStep("from");
                            }}
                            className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                                selectionMode === "range"
                                    ? "bg-card font-semibold text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <ArrowRight className="size-3" />
                            {isAmharic ? "ክልል" : "Range"}
                        </button>
                    </div>
                ) : (
                    <p className="text-[10px] text-muted-foreground">
                        {selectionMode === "single"
                            ? isAmharic
                                ? "ቀን"
                                : "Date"
                            : isAmharic
                              ? "ክልል"
                              : "Range"}
                    </p>
                )}

                <div className="flex rounded-md border border-hairline bg-secondary/40 p-px">
                    <button
                        type="button"
                        onClick={() => setMode("ETHIOPIAN")}
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                            calendarMode === "ETHIOPIAN"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {isAmharic ? "ዓ.ም." : "E.C."}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("GREGORIAN")}
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                            calendarMode === "GREGORIAN"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {isAmharic ? "ፈረንጅ" : "G.C."}
                    </button>
                </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
                {selectionMode === "single" ? (
                    <>
                        <PresetChip
                            active={draftFrom === todayYmd}
                            onClick={() => pickPresetDay(0)}
                            label={isAmharic ? "ዛሬ" : "Today"}
                        />
                        <PresetChip
                            onClick={() => pickPresetDay(1)}
                            label={isAmharic ? "ትላንት" : "Yday"}
                        />
                    </>
                ) : (
                    <>
                        <PresetChip
                            onClick={() => pickPresetRange(7)}
                            label="7d"
                        />
                        <PresetChip
                            onClick={() => pickPresetRange(30)}
                            label="30d"
                        />
                        <PresetChip
                            onClick={() => pickPresetRange(90)}
                            label="90d"
                        />
                    </>
                )}
            </div>

            <div className="mt-2 rounded-lg border border-hairline bg-secondary/15 p-1.5">
                <div className="mb-1 flex items-center justify-between gap-1">
                    <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => {
                            if (calendarMode === "ETHIOPIAN") {
                                setEthCursor(c => shiftEthMonth(c, -1));
                            } else {
                                setGregCursor(c => shiftGregMonth(c, -1));
                            }
                        }}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>
                    <p className="text-[11px] font-semibold text-foreground">
                        {monthTitle}
                    </p>
                    <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => {
                            if (calendarMode === "ETHIOPIAN") {
                                setEthCursor(c => shiftEthMonth(c, 1));
                            } else {
                                setGregCursor(c => shiftGregMonth(c, 1));
                            }
                        }}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>

                <div className="mb-0.5 grid grid-cols-7">
                    {weekdays.map(label => (
                        <div
                            key={label}
                            className="py-0.5 text-center text-[9px] font-medium text-muted-foreground"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px">
                    {cells.map((cell, idx) => (
                        <button
                            key={`${cell.ymd || "pad"}-${idx}`}
                            type="button"
                            disabled={!cell.inMonth}
                            onClick={() => cell.ymd && pickDay(cell.ymd)}
                            className={dayButtonClass(cell.ymd)}
                        >
                            {cell.inMonth ? cell.day : ""}
                        </button>
                    ))}
                </div>

                {selectionMode === "range" ? (
                    <p className="mt-1 text-center text-[9px] text-muted-foreground">
                        {rangePickStep === "from"
                            ? isAmharic
                                ? "መጀመሪያ"
                                : "Start"
                            : isAmharic
                              ? "መጨረሻ"
                              : "End"}
                    </p>
                ) : null}
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-foreground">
                        {primaryLabel}
                    </p>
                    <p className="truncate text-[9px] text-muted-foreground">
                        {secondaryLabel}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {onClear ? (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex size-7 items-center justify-center rounded-md border border-hairline text-muted-foreground hover:text-foreground"
                            title={clearLabel ?? (isAmharic ? "አጽዳ" : "Clear")}
                        >
                            <RotateCcw className="size-3" />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={apply}
                        disabled={
                            !draftFrom ||
                            (selectionMode === "range" && !draftTo)
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Check className="size-3" />
                        {applyLabel ?? (isAmharic ? "ተግብር" : "Apply")}
                    </button>
                </div>
            </div>
        </div>
    );

    if (!isPopover) return panel;

    return (
        <>
            {onDismiss ? (
                <button
                    type="button"
                    aria-label="Dismiss date picker"
                    className="fixed inset-0 z-[60] cursor-default bg-transparent"
                    onClick={onDismiss}
                />
            ) : null}
            <div className="absolute left-0 top-full z-[70] mt-1.5">
                {panel}
            </div>
        </>
    );
}

function PresetChip({
    label,
    onClick,
    active,
}: {
    label: string;
    onClick: () => void;
    active?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-hairline bg-card text-muted-foreground hover:text-foreground",
            )}
        >
            {label}
        </button>
    );
}

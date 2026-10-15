"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Calendar,
    ArrowRight,
    Check,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    type CalendarMode,
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

export interface CalendarDateFilterProps {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    onApply: (dates: { from: string; to: string }) => void;
    onClear?: () => void;
    className?: string;
}

type CustomFilterMode = "single" | "range";

export default function CalendarDateFilter({
    from,
    to,
    onApply,
    onClear,
    className,
}: CalendarDateFilterProps) {
    const locale = useLocale();
    const isAmharic = locale === "am";
    const tManager = useTranslations("manager");

    const [calendarMode, setCalendarMode] = useState<CalendarMode>("ETHIOPIAN");

    useEffect(() => {
        setCalendarMode(getSavedCalendarMode());
        const handleModeChange = (e: Event) => {
            const customEvent = e as CustomEvent<CalendarMode>;
            if (customEvent.detail) setCalendarMode(customEvent.detail);
        };
        window.addEventListener("calendar_mode_changed", handleModeChange);
        return () =>
            window.removeEventListener(
                "calendar_mode_changed",
                handleModeChange,
            );
    }, []);

    const toggleCalendarSystem = (newMode: CalendarMode) => {
        setCalendarMode(newMode);
        setSavedCalendarMode(newMode);
    };

    const todayYmd = useMemo(() => formatToYmd(new Date()), []);

    // Filter mode: single day or range
    const [filterMode, setFilterMode] = useState<CustomFilterMode>(() => {
        if (from && to && from !== to) return "range";
        return "single";
    });

    const [customFrom, setCustomFrom] = useState<string>(
        () => from || todayYmd,
    );
    const [customTo, setCustomTo] = useState<string>(
        () => to || (from ? from : todayYmd),
    );

    // Update if props change
    useEffect(() => {
        if (from) setCustomFrom(from);
        if (to) setCustomTo(to);
        if (from && to && from !== to) {
            setFilterMode("range");
        }
    }, [from, to]);

    // Ethiopian details for from & to
    const ethFrom = useMemo(
        () => getEthiopianDateDetails(parseYmdToLocalDate(customFrom)),
        [customFrom],
    );
    const ethTo = useMemo(
        () => getEthiopianDateDetails(parseYmdToLocalDate(customTo)),
        [customTo],
    );

    // Available Ethiopian years (e.g. current year - 3 to + 1)
    const ethYears = useMemo(() => {
        const curY = ethFrom.year;
        const years: number[] = [];
        for (let y = curY - 3; y <= curY + 1; y++) {
            years.push(y);
        }
        return years;
    }, [ethFrom.year]);

    const handleApply = () => {
        if (filterMode === "single") {
            if (!customFrom) return;
            onApply({ from: customFrom, to: customFrom });
        } else {
            if (!customFrom || !customTo) return;
            const [finalFrom, finalTo] =
                customFrom <= customTo
                    ? [customFrom, customTo]
                    : [customTo, customFrom];
            onApply({ from: finalFrom, to: finalTo });
        }
    };

    // Quick single day presets
    const pickPresetDay = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() - offsetDays);
        const ymd = formatToYmd(d);
        setCustomFrom(ymd);
        setCustomTo(ymd);
    };

    // Quick range presets
    const pickPresetRange = (daysBack: number) => {
        const toD = new Date();
        const fromD = new Date();
        fromD.setDate(fromD.getDate() - (daysBack - 1));
        setCustomFrom(formatToYmd(fromD));
        setCustomTo(formatToYmd(toD));
    };

    // Handle Ethiopian selector changes
    const handleEthFromChange = (
        field: "year" | "month" | "date",
        val: number,
    ) => {
        let y = ethFrom.year;
        let m = ethFrom.month;
        let d = ethFrom.date;
        if (field === "year") y = val;
        if (field === "month") m = val;
        if (field === "date") d = val;

        const maxD = getDaysInEthiopianMonth(y, m);
        if (d > maxD) d = maxD;

        const gDate = ethiopianToGregorianDate(y, m, d);
        const ymd = formatToYmd(gDate);
        setCustomFrom(ymd);
        if (filterMode === "single") {
            setCustomTo(ymd);
        }
    };

    const handleEthToChange = (
        field: "year" | "month" | "date",
        val: number,
    ) => {
        let y = ethTo.year;
        let m = ethTo.month;
        let d = ethTo.date;
        if (field === "year") y = val;
        if (field === "month") m = val;
        if (field === "date") d = val;

        const maxD = getDaysInEthiopianMonth(y, m);
        if (d > maxD) d = maxD;

        const gDate = ethiopianToGregorianDate(y, m, d);
        setCustomTo(formatToYmd(gDate));
    };

    return (
        <div
            className={cn(
                "rounded-[16px] border border-hairline bg-card p-3 shadow-xs transition-all space-y-3",
                className,
            )}
        >
            {/* Top Row: Mode selector + Calendar system toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Single Day vs Date Range Mode */}
                <div className="flex rounded-lg border border-hairline bg-secondary/30 p-0.5">
                    <button
                        type="button"
                        onClick={() => {
                            setFilterMode("single");
                            setCustomTo(customFrom);
                        }}
                        className={cn(
                            "flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
                            filterMode === "single"
                                ? "bg-card text-foreground font-semibold shadow-xs"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <CalendarDays className="size-3.5" />
                        <span>{isAmharic ? "አንድ ቀን ብቻ" : "Single Day"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilterMode("range");
                            if (customFrom === customTo) {
                                const d = parseYmdToLocalDate(customTo);
                                d.setDate(d.getDate() - 6);
                                setCustomFrom(formatToYmd(d));
                            }
                        }}
                        className={cn(
                            "flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-medium transition-colors",
                            filterMode === "range"
                                ? "bg-card text-foreground font-semibold shadow-xs"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <ArrowRight className="size-3.5" />
                        <span>
                            {isAmharic ? "የቀናት ክልል (ከ - እስከ)" : "Date Range"}
                        </span>
                    </button>
                </div>

                {/* Calendar system switch: Ethiopian vs Gregorian */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() =>
                            toggleCalendarSystem(
                                calendarMode === "ETHIOPIAN"
                                    ? "GREGORIAN"
                                    : "ETHIOPIAN",
                            )
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-hairline bg-secondary/30 px-2 py-1 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        title={
                            isAmharic
                                ? "የቀን መቁጠሪያ ቀይር"
                                : "Switch calendar system"
                        }
                    >
                        <span>
                            {calendarMode === "ETHIOPIAN"
                                ? "🇪🇹 ዓ.ም."
                                : "🌐 G.C."}
                        </span>
                        <span className="text-[10px] text-brand underline font-normal">
                            {calendarMode === "ETHIOPIAN"
                                ? isAmharic
                                    ? "(ወደ ፈረንጅ)"
                                    : "(Switch to G.C.)"
                                : isAmharic
                                  ? "(ወደ ኢትዮጵያ)"
                                  : "(Switch to E.C.)"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Middle Row: Quick chips + Date Inputs + Apply button (All inline like dashboard!) */}
            <div className="flex flex-wrap items-end gap-3 pt-1">
                {/* Presets Chips */}
                {filterMode === "single" ? (
                    <div className="flex items-center gap-1.5 pb-1">
                        <span className="text-[11px] text-slate-gray">
                            {isAmharic ? "ፈጣን፦" : "Quick:"}
                        </span>
                        <button
                            type="button"
                            onClick={() => pickPresetDay(0)}
                            className={cn(
                                "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                                customFrom === todayYmd
                                    ? "border-brand bg-brand/10 text-brand font-semibold"
                                    : "border-hairline bg-card text-slate-gray hover:text-foreground",
                            )}
                        >
                            {isAmharic ? "ዛሬ" : "Today"}
                        </button>
                        <button
                            type="button"
                            onClick={() => pickPresetDay(1)}
                            className="rounded-md border border-hairline bg-card px-2 py-1 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        >
                            {isAmharic ? "ትላንት" : "Yesterday"}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 pb-1">
                        <span className="text-[11px] text-slate-gray">
                            {isAmharic ? "ፈጣን፦" : "Quick:"}
                        </span>
                        <button
                            type="button"
                            onClick={() => pickPresetRange(3)}
                            className="rounded-md border border-hairline bg-card px-2 py-1 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        >
                            {isAmharic ? "3 ቀናት" : "3 Days"}
                        </button>
                        <button
                            type="button"
                            onClick={() => pickPresetRange(7)}
                            className="rounded-md border border-hairline bg-card px-2 py-1 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        >
                            {isAmharic ? "7 ቀናት" : "7 Days"}
                        </button>
                        <button
                            type="button"
                            onClick={() => pickPresetRange(30)}
                            className="rounded-md border border-hairline bg-card px-2 py-1 text-[11px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        >
                            {isAmharic ? "30 ቀናት" : "30 Days"}
                        </button>
                    </div>
                )}

                {/* Date Inputs: Depending on Calendar Mode */}
                {calendarMode === "GREGORIAN" ? (
                    <>
                        {filterMode === "single" ? (
                            <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                {isAmharic ? "ቀን" : "Date"}
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={e => {
                                        setCustomFrom(e.target.value);
                                        setCustomTo(e.target.value);
                                    }}
                                    className="rounded-md border border-hairline bg-card px-2.5 py-1.5 text-[13px] text-foreground focus:border-brand focus:outline-hidden"
                                />
                            </label>
                        ) : (
                            <>
                                <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                    {tManager("fromDate")}
                                    <input
                                        type="date"
                                        value={customFrom}
                                        onChange={e =>
                                            setCustomFrom(e.target.value)
                                        }
                                        className="rounded-md border border-hairline bg-card px-2.5 py-1.5 text-[13px] text-foreground focus:border-brand focus:outline-hidden"
                                    />
                                </label>
                                <label className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                    {tManager("toDate")}
                                    <input
                                        type="date"
                                        value={customTo}
                                        onChange={e =>
                                            setCustomTo(e.target.value)
                                        }
                                        className="rounded-md border border-hairline bg-card px-2.5 py-1.5 text-[13px] text-foreground focus:border-brand focus:outline-hidden"
                                    />
                                </label>
                            </>
                        )}
                    </>
                ) : (
                    /* Ethiopian Dropdown Selectors */
                    <div className="flex flex-wrap items-end gap-2">
                        {filterMode === "single" ? (
                            <div className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                <span>
                                    {isAmharic ? "የኢትዮጵያ ቀን" : "Ethiopian Date"}
                                </span>
                                <div className="flex items-center gap-1">
                                    {/* Month */}
                                    <select
                                        value={ethFrom.month}
                                        onChange={e =>
                                            handleEthFromChange(
                                                "month",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                    >
                                        {ETHIOPIAN_MONTHS.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {isAmharic
                                                    ? m.nameAm
                                                    : m.nameEn}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Day */}
                                    <select
                                        value={ethFrom.date}
                                        onChange={e =>
                                            handleEthFromChange(
                                                "date",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                    >
                                        {Array.from(
                                            {
                                                length: getDaysInEthiopianMonth(
                                                    ethFrom.year,
                                                    ethFrom.month,
                                                ),
                                            },
                                            (_, i) => i + 1,
                                        ).map(d => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Year */}
                                    <select
                                        value={ethFrom.year}
                                        onChange={e =>
                                            handleEthFromChange(
                                                "year",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                    >
                                        {ethYears.map(y => (
                                            <option key={y} value={y}>
                                                {y} {isAmharic ? "ዓ.ም." : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-end gap-3">
                                {/* From */}
                                <div className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                    <span>
                                        {isAmharic ? "ከ (መነሻ)" : "From"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <select
                                            value={ethFrom.month}
                                            onChange={e =>
                                                handleEthFromChange(
                                                    "month",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {ETHIOPIAN_MONTHS.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {isAmharic
                                                        ? m.nameAm
                                                        : m.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={ethFrom.date}
                                            onChange={e =>
                                                handleEthFromChange(
                                                    "date",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {Array.from(
                                                {
                                                    length: getDaysInEthiopianMonth(
                                                        ethFrom.year,
                                                        ethFrom.month,
                                                    ),
                                                },
                                                (_, i) => i + 1,
                                            ).map(d => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={ethFrom.year}
                                            onChange={e =>
                                                handleEthFromChange(
                                                    "year",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {ethYears.map(y => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* To */}
                                <div className="flex flex-col gap-1 text-[11px] text-slate-gray">
                                    <span>
                                        {isAmharic ? "እስከ (መድረሻ)" : "To"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <select
                                            value={ethTo.month}
                                            onChange={e =>
                                                handleEthToChange(
                                                    "month",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {ETHIOPIAN_MONTHS.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {isAmharic
                                                        ? m.nameAm
                                                        : m.nameEn}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={ethTo.date}
                                            onChange={e =>
                                                handleEthToChange(
                                                    "date",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {Array.from(
                                                {
                                                    length: getDaysInEthiopianMonth(
                                                        ethTo.year,
                                                        ethTo.month,
                                                    ),
                                                },
                                                (_, i) => i + 1,
                                            ).map(d => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={ethTo.year}
                                            onChange={e =>
                                                handleEthToChange(
                                                    "year",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="rounded-md border border-hairline bg-card px-2 py-1.5 text-[13px] font-medium text-foreground focus:border-brand focus:outline-hidden"
                                        >
                                            {ethYears.map(y => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Apply Button */}
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={
                        !customFrom || (filterMode === "range" && !customTo)
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-xs transition-opacity hover:bg-brand/90 disabled:opacity-50"
                >
                    <Check className="size-3.5" />
                    <span>{tManager("applyRange")}</span>
                </button>

                {/* Reset button if filter is active */}
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md border border-hairline bg-card px-2.5 py-1.5 text-[12px] font-medium text-slate-gray hover:text-foreground transition-colors"
                        title={isAmharic ? "ወደ ነባሪ መልስ" : "Reset filter"}
                    >
                        <RotateCcw className="size-3" />
                        <span>{isAmharic ? "አጽዳ" : "Reset"}</span>
                    </button>
                )}
            </div>

            {/* Subtle live preview caption */}
            <div className="flex items-center gap-2 pt-1 border-t border-hairline/60 text-[11px] text-slate-gray">
                <Sparkles className="size-3 text-brand shrink-0" />
                <span>
                    {isAmharic ? "የተመረጠው፦ " : "Selected: "}
                    <strong className="text-foreground font-medium">
                        {formatDateRangeLabel(
                            customFrom,
                            filterMode === "single" ? customFrom : customTo,
                            calendarMode,
                            isAmharic,
                        )}
                    </strong>
                    {" · "}
                    <span>
                        {calendarMode === "ETHIOPIAN"
                            ? formatDateRangeLabel(
                                  customFrom,
                                  filterMode === "single"
                                      ? customFrom
                                      : customTo,
                                  "GREGORIAN",
                                  false,
                              )
                            : formatDateRangeLabel(
                                  customFrom,
                                  filterMode === "single"
                                      ? customFrom
                                      : customTo,
                                  "ETHIOPIAN",
                                  true,
                              )}
                    </span>
                </span>
            </div>
        </div>
    );
}

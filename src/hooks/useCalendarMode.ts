"use client";

import { useEffect, useState } from "react";
import {
    formatEthiopianLocalTime,
    getEthiopianDateDetails,
    getSavedCalendarMode,
    setSavedCalendarMode,
    type CalendarMode,
} from "@/lib/ethiopian-calendar";

export function useCalendarMode() {
    const [mode, setMode] = useState<CalendarMode>("ETHIOPIAN");

    useEffect(() => {
        setMode(getSavedCalendarMode());
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<CalendarMode>).detail;
            if (detail === "ETHIOPIAN" || detail === "GREGORIAN") {
                setMode(detail);
            } else {
                setMode(getSavedCalendarMode());
            }
        };
        window.addEventListener("calendar_mode_changed", handler);
        return () =>
            window.removeEventListener("calendar_mode_changed", handler);
    }, []);

    const updateMode = (next: CalendarMode) => {
        setMode(next);
        setSavedCalendarMode(next);
    };

    return { calendarMode: mode, setCalendarMode: updateMode };
}

export function formatCalendarDateTime(
    input: string | Date,
    locale: string,
    calendarMode: CalendarMode,
    includeTime = true,
): string {
    const d = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return "—";

    const isAm = locale === "am";

    if (calendarMode === "ETHIOPIAN") {
        const eth = getEthiopianDateDetails(d);
        const datePart = isAm ? eth.formattedAm : eth.formattedEn;
        if (!includeTime) return datePart;
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ethTime = formatEthiopianLocalTime(`${hh}:${mm}`);
        return `${datePart} · ${isAm ? ethTime.formattedAm : ethTime.formattedEn}`;
    }

    return includeTime
        ? d.toLocaleString(isAm ? "am-ET" : "en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : d.toLocaleDateString(isAm ? "am-ET" : "en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          });
}

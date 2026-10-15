import { EthDateTime } from "ethiopian-calendar-date-converter";

export type CalendarMode = "ETHIOPIAN" | "GREGORIAN";

export const ETHIOPIAN_MONTHS = [
    {
        id: 1,
        nameEn: "Meskerem",
        nameAm: "መስከረም",
        shortEn: "Mes",
        shortAm: "መስ",
    },
    { id: 2, nameEn: "Tikimt", nameAm: "ጥቅምት", shortEn: "Tik", shortAm: "ጥቅ" },
    { id: 3, nameEn: "Hidar", nameAm: "ኅዳር", shortEn: "Hid", shortAm: "ኅዳ" },
    { id: 4, nameEn: "Tahsas", nameAm: "ታኅሣሥ", shortEn: "Tah", shortAm: "ታኅ" },
    { id: 5, nameEn: "Tir", nameAm: "ጥር", shortEn: "Tir", shortAm: "ጥር" },
    { id: 6, nameEn: "Yakatit", nameAm: "የካቲት", shortEn: "Yak", shortAm: "የካ" },
    { id: 7, nameEn: "Megabit", nameAm: "መጋቢት", shortEn: "Meg", shortAm: "መጋ" },
    { id: 8, nameEn: "Miyazya", nameAm: "ሚያዝያ", shortEn: "Miy", shortAm: "ሚያ" },
    { id: 9, nameEn: "Ginbot", nameAm: "ግንቦት", shortEn: "Gin", shortAm: "ግን" },
    { id: 10, nameEn: "Sene", nameAm: "ሰኔ", shortEn: "Sen", shortAm: "ሰኔ" },
    { id: 11, nameEn: "Hamle", nameAm: "ሐምሌ", shortEn: "Ham", shortAm: "ሐም" },
    { id: 12, nameEn: "Nehase", nameAm: "ነሐሴ", shortEn: "Neh", shortAm: "ነሐ" },
    { id: 13, nameEn: "Pagume", nameAm: "ጳጉሜ", shortEn: "Pag", shortAm: "ጳጉ" },
] as const;

export const ETHIOPIAN_DAYS = [
    { key: "Mon", en: "Monday", am: "ሰኞ", shortEn: "Mon", shortAm: "ሰኞ" },
    { key: "Tue", en: "Tuesday", am: "ማክሰኞ", shortEn: "Tue", shortAm: "ማክ" },
    { key: "Wed", en: "Wednesday", am: "ረቡዕ", shortEn: "Wed", shortAm: "ረቡ" },
    { key: "Thu", en: "Thursday", am: "ሐሙስ", shortEn: "Thu", shortAm: "ሐሙ" },
    { key: "Fri", en: "Friday", am: "ዓርብ", shortEn: "Fri", shortAm: "ዓር" },
    { key: "Sat", en: "Saturday", am: "ቅዳሜ", shortEn: "Sat", shortAm: "ቅዳ" },
    { key: "Sun", en: "Sunday", am: "እሑድ", shortEn: "Sun", shortAm: "እሑ" },
] as const;

export interface EthiopianDateDetails {
    year: number;
    month: number;
    date: number;
    monthNameEn: string;
    monthNameAm: string;
    dayNameEn: string;
    dayNameAm: string;
    formattedEn: string;
    formattedAm: string;
}

/**
 * Converts any standard JavaScript Date into detailed Ethiopian Calendar information.
 */
export function getEthiopianDateDetails(
    date: Date = new Date(),
): EthiopianDateDetails {
    const eth = EthDateTime.fromEuropeanDate(date);
    const monthObj =
        ETHIOPIAN_MONTHS.find(m => m.id === eth.month) ?? ETHIOPIAN_MONTHS[0];

    // Day of week index (Monday = 0, Sunday = 6)
    const dayIndex = (date.getDay() + 6) % 7;
    const dayObj = ETHIOPIAN_DAYS[dayIndex];

    return {
        year: eth.year,
        month: eth.month,
        date: eth.date,
        monthNameEn: monthObj.nameEn,
        monthNameAm: monthObj.nameAm,
        dayNameEn: dayObj.en,
        dayNameAm: dayObj.am,
        formattedEn: `${monthObj.nameEn} ${eth.date}, ${eth.year}`,
        formattedAm: `${monthObj.nameAm} ${eth.date}፣ ${eth.year} ዓ.ም.`,
    };
}

/**
 * Converts an Ethiopian year, month (1-13), and day (1-30) into a standard JavaScript Date.
 */
export function ethiopianToGregorianDate(
    year: number,
    month: number,
    date: number,
    hour = 0,
    minute = 0,
    second = 0,
): Date {
    const eth = new EthDateTime(year, month, date, hour, minute, second);
    return eth.toEuropeanDate();
}

/**
 * Formats a date label according to the active calendar mode.
 */
export function formatDayCellLabel(
    date: Date,
    mode: CalendarMode,
    isAmharic = true,
): { dayTitle: string; dateNum: string } {
    if (mode === "ETHIOPIAN") {
        const details = getEthiopianDateDetails(date);
        const dayIndex = (date.getDay() + 6) % 7;
        const dayObj = ETHIOPIAN_DAYS[dayIndex];
        return {
            dayTitle: isAmharic ? dayObj.am : dayObj.shortEn,
            dateNum: isAmharic
                ? `${details.monthNameAm} ${details.date}`
                : `${details.monthNameEn} ${details.date}`,
        };
    }

    const monthStr = date.toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
        month: "short",
    });
    const dayIndex = (date.getDay() + 6) % 7;
    const dayObj = ETHIOPIAN_DAYS[dayIndex];

    return {
        dayTitle: isAmharic ? dayObj.am : dayObj.shortEn,
        dateNum: `${monthStr} ${date.getDate()}`,
    };
}

/**
 * Formats a week header range according to the calendar mode.
 */
export function formatWeekHeaderRange(
    startDate: Date,
    endDate: Date,
    mode: CalendarMode,
    isAmharic = true,
): string {
    if (mode === "ETHIOPIAN") {
        const start = getEthiopianDateDetails(startDate);
        const end = getEthiopianDateDetails(endDate);
        if (start.month === end.month) {
            const mName = isAmharic ? start.monthNameAm : start.monthNameEn;
            const suffix = isAmharic
                ? `፣ ${end.year} ዓ.ም.`
                : `, ${end.year} E.C.`;
            return `${mName} ${start.date} – ${end.date}${suffix}`;
        }
        const sM = isAmharic ? start.monthNameAm : start.monthNameEn;
        const eM = isAmharic ? end.monthNameAm : end.monthNameEn;
        const suffix = isAmharic ? `፣ ${end.year} ዓ.ም.` : `, ${end.year} E.C.`;
        return `${sM} ${start.date} – ${eM} ${end.date}${suffix}`;
    }

    const startMonth = startDate.toLocaleDateString(
        isAmharic ? "am-ET" : "en-US",
        { month: "short" },
    );
    const endMonth = endDate.toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
        month: "short",
    });
    return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
}

/**
 * Returns total days in an Ethiopian month (30 for months 1-12, 5 or 6 for Pagume 13).
 */
export function getDaysInEthiopianMonth(year: number, month: number): number {
    if (month >= 1 && month <= 12) return 30;
    if (month === 13) {
        return year % 4 === 3 ? 6 : 5;
    }
    return 30;
}

/**
 * Converts a standard Date object into YYYY-MM-DD string using local calendar numbers.
 */
export function formatToYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD string into a midday Date object (preventing timezone day shifting).
 */
export function parseYmdToLocalDate(ymd: string): Date {
    const parts = ymd.split("-").map(Number);
    const y = parts[0] || new Date().getFullYear();
    const m = (parts[1] || 1) - 1;
    const d = parts[2] || 1;
    return new Date(y, m, d, 12, 0, 0);
}

/**
 * Formats a single day or a date range (YYYY-MM-DD) nicely for display.
 */
export function formatDateRangeLabel(
    fromYmd: string,
    toYmd: string,
    mode: CalendarMode = "ETHIOPIAN",
    isAmharic = true,
): string {
    const fromDate = parseYmdToLocalDate(fromYmd);
    const toDate = parseYmdToLocalDate(toYmd);
    const isSingleDay = fromYmd === toYmd;

    if (mode === "ETHIOPIAN") {
        const fromEth = getEthiopianDateDetails(fromDate);
        if (isSingleDay) {
            return isAmharic
                ? fromEth.formattedAm
                : `${fromEth.monthNameEn} ${fromEth.date}, ${fromEth.year}`;
        }
        const toEth = getEthiopianDateDetails(toDate);
        if (fromEth.year === toEth.year && fromEth.month === toEth.month) {
            const mName = isAmharic ? fromEth.monthNameAm : fromEth.monthNameEn;
            const suffix = isAmharic
                ? `፣ ${toEth.year} ዓ.ም.`
                : `, ${toEth.year}`;
            return `${mName} ${fromEth.date} – ${toEth.date}${suffix}`;
        }
        const m1 = isAmharic ? fromEth.monthNameAm : fromEth.monthNameEn;
        const m2 = isAmharic ? toEth.monthNameAm : toEth.monthNameEn;
        const suffix = isAmharic ? `፣ ${toEth.year} ዓ.ም.` : `, ${toEth.year}`;
        return `${m1} ${fromEth.date} – ${m2} ${toEth.date}${suffix}`;
    }

    if (isSingleDay) {
        return fromDate.toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    const m1 = fromDate.toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
        month: "short",
    });
    const m2 = toDate.toLocaleDateString(isAmharic ? "am-ET" : "en-US", {
        month: "short",
    });
    if (
        fromDate.getFullYear() === toDate.getFullYear() &&
        fromDate.getMonth() === toDate.getMonth()
    ) {
        return `${m1} ${fromDate.getDate()} – ${toDate.getDate()}, ${toDate.getFullYear()}`;
    }
    return `${m1} ${fromDate.getDate()} – ${m2} ${toDate.getDate()}, ${toDate.getFullYear()}`;
}

const CALENDAR_STORAGE_KEY = "fanaye_restaurant_calendar_mode";

/**
 * Retrieves the currently active calendar mode (stored in browser local storage).
 */
export function getSavedCalendarMode(): CalendarMode {
    if (typeof window === "undefined") return "ETHIOPIAN";
    const saved = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (saved === "GREGORIAN" || saved === "ETHIOPIAN") return saved;
    return "ETHIOPIAN"; // Default for Ethiopian restaurants
}

/**
 * Saves and emits an update for the active calendar mode.
 */
export function setSavedCalendarMode(mode: CalendarMode): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(CALENDAR_STORAGE_KEY, mode);
    window.dispatchEvent(
        new CustomEvent("calendar_mode_changed", { detail: mode }),
    );
}

/**
 * Converts a standard 24-hour time string ("07:00", "15:30") to Ethiopian 12-hour clock representation.
 * In Ethiopia, the 12-hour cycle begins at 6:00 AM (sunrise) and 6:00 PM (sunset).
 * 07:00 -> 1:00 ጠዋት (Morning 1:00)
 * 15:00 -> 9:00 ከሰዓት (Afternoon 9:00)
 * 23:00 -> 5:00 ማታ (Night 5:00)
 */
export function formatEthiopianLocalTime(time24: string): {
    ethHour: number;
    minute: number;
    periodAm: string;
    periodEn: string;
    formattedAm: string;
    formattedEn: string;
} {
    const parts = time24.split(":");
    const hour = parseInt(parts[0], 10) || 0;
    const minute = parseInt(parts[1], 10) || 0;
    const minStr = minute < 10 ? `0${minute}` : `${minute}`;

    let ethHour: number;
    let periodAm: string;
    let periodEn: string;

    if (hour >= 6 && hour < 12) {
        ethHour = hour - 6 === 0 ? 12 : hour - 6;
        periodAm = "ጠዋት";
        periodEn = "Morning";
    } else if (hour === 12) {
        ethHour = 6;
        periodAm = "ቀትር";
        periodEn = "Noon";
    } else if (hour > 12 && hour < 18) {
        ethHour = hour - 6;
        periodAm = "ከሰዓት";
        periodEn = "Afternoon";
    } else if (hour >= 18 && hour < 24) {
        ethHour = hour - 18 === 0 ? 12 : hour - 18;
        periodAm = "ማታ";
        periodEn = "Night";
    } else {
        // 00:00 to 05:59
        ethHour = hour + 6;
        periodAm = "ሌሊት";
        periodEn = "Dawn/Night";
    }

    return {
        ethHour,
        minute,
        periodAm,
        periodEn,
        formattedAm: `${ethHour}:${minStr} ${periodAm}`,
        formattedEn: `${ethHour}:${minStr} (${periodEn})`,
    };
}

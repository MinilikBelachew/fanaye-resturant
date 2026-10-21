"use client";

/**
 * Shared date filter used across manager screens.
 * Re-exports DualCalendarDatePicker (Ethiopian + Gregorian month grids).
 * Values are always Gregorian YYYY-MM-DD for the API.
 */
export {
    default,
    type DualCalendarDatePickerProps as CalendarDateFilterProps,
    type DatePickerSelectionMode,
} from "@/components/custom/molecules/DualCalendarDatePicker";

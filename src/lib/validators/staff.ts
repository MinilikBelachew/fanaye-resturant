import { z } from "zod";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const optionalEtPhone = z
    .string()
    .trim()
    .optional()
    .refine(value => {
        if (!value || value === "" || value === "+251" || value === "+251 ")
            return true;
        const digits = value.replace(/\D/g, "");
        if (digits.length === 0 || digits === "251") return true;

        // Ethiopian mobile: 9 digits after 251 or 0 (starting with 9 or 7)
        if (digits.startsWith("251")) {
            return digits.length === 12 && /^251[79]\d{8}$/.test(digits);
        }
        if (digits.startsWith("0")) {
            return digits.length === 10 && /^0[79]\d{8}$/.test(digits);
        }
        if (digits.length === 9 && /^[79]\d{8}$/.test(digits)) {
            return true;
        }
        // Allow previously saved international phone numbers (e.g. +1 ...) so existing staff don't fail edit validation
        if (
            value.startsWith("+") &&
            !value.startsWith("+251") &&
            digits.length >= 7
        ) {
            return true;
        }
        return false;
    }, "Enter a valid 9-digit Ethiopian mobile (+251 9X... or +251 7X...).");

export const staffFormSchema = z
    .object({
        name: z.string().trim().min(1, "Staff full name is required."),
        role: z.string().trim().min(1, "Role is required."),
        preparationStationId: z.string().optional().or(z.literal("")),
        stationCode: z.string().optional().or(z.literal("")),
        phone: optionalEtPhone,
        email: z
            .string()
            .trim()
            .min(1, "Email is required.")
            .email("Enter a valid email."),
        /** Empty on edit = keep current PIN. Create must supply 4 digits. */
        pin: z
            .string()
            .trim()
            .refine(value => value === "" || /^\d{4}$/.test(value), {
                message: "PIN must be exactly 4 digits.",
            }),
        hireDate: z.string().optional().or(z.literal("")),
        photoId: z.string().optional().or(z.literal("")),
        licencePlate: z.string().trim().optional(),
        vehicleDesc: z.string().trim().optional(),
        active: z.boolean(),
        /** Per weekday: shift definition id, or "" for off */
        dayShiftByDay: z.record(z.string(), z.string()),
        /** Tables assigned per shift window id */
        assignedTablesByShift: z.record(z.string(), z.array(z.string())),
        /** Which shift's floor map is being edited */
        coverageShiftId: z.string().optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
        if (data.role === "driver") {
            const digits = (data.phone || "").replace(/\D/g, "");
            const isEt =
                (digits.startsWith("251") &&
                    digits.length === 12 &&
                    /^251[79]\d{8}$/.test(digits)) ||
                (digits.startsWith("0") &&
                    digits.length === 10 &&
                    /^0[79]\d{8}$/.test(digits)) ||
                (digits.length === 9 && /^[79]\d{8}$/.test(digits));
            if (!isEt) {
                ctx.addIssue({
                    code: "custom",
                    path: ["phone"],
                    message:
                        "Valid Ethiopian mobile is required for drivers (+251 9X... or +251 7X...).",
                });
            }
            if (!data.licencePlate || data.licencePlate.trim().length < 2) {
                ctx.addIssue({
                    code: "custom",
                    path: ["licencePlate"],
                    message:
                        "Licence plate number is required (e.g. 3-12345 AA).",
                });
            }
            return;
        }

        const assignedDays = WEEKDAYS.filter(
            day => (data.dayShiftByDay[day] || "").trim().length > 0,
        );
        if (
            (data.role === "waiter" || data.role === "cashier") &&
            assignedDays.length === 0
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["dayShiftByDay"],
                message: "Assign at least one day and shift window.",
            });
        }

        if (data.role === "waiter") {
            const usedShifts = [
                ...new Set(
                    assignedDays
                        .map(day => data.dayShiftByDay[day])
                        .filter(Boolean),
                ),
            ];
            const hasAnyTables = usedShifts.some(
                shiftId =>
                    (data.assignedTablesByShift[shiftId] || []).length > 0,
            );
            if (usedShifts.length > 0 && !hasAnyTables) {
                // Tables optional at create — warn only when coverageShift set with empty
                // Allow empty tables (manager can assign later)
            }
        }
    });

export type StaffFormValues = z.infer<typeof staffFormSchema>;

const emptyDayShiftByDay = Object.fromEntries(
    WEEKDAYS.map(day => [day, ""]),
) as Record<(typeof WEEKDAYS)[number], string>;

export const staffFormDefaults: StaffFormValues = {
    name: "",
    role: "waiter",
    preparationStationId: "",
    stationCode: "",
    phone: "",
    email: "",
    pin: "",
    hireDate: "",
    photoId: "",
    licencePlate: "",
    vehicleDesc: "",
    active: true,
    dayShiftByDay: { ...emptyDayShiftByDay },
    assignedTablesByShift: {},
    coverageShiftId: "",
};

export function dayShiftsFromForm(
    dayShiftByDay: Record<string, string>,
): Array<{ dayCode: string; shiftDefinitionId: string }> {
    return WEEKDAYS.filter(day => (dayShiftByDay[day] || "").trim()).map(
        day => ({
            dayCode: day,
            shiftDefinitionId: dayShiftByDay[day].trim(),
        }),
    );
}

export function tableCoveragesFromForm(
    dayShiftByDay: Record<string, string>,
    assignedTablesByShift: Record<string, string[]>,
): Array<{
    shiftDefinitionId: string;
    tableIds: string[];
    applyToAllDays?: boolean;
}> {
    const used = [
        ...new Set(
            WEEKDAYS.map(day => dayShiftByDay[day] || "").filter(Boolean),
        ),
    ];
    return used.map(shiftDefinitionId => ({
        shiftDefinitionId,
        tableIds: assignedTablesByShift[shiftDefinitionId] || [],
        applyToAllDays: true,
    }));
}

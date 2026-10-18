import { z } from "zod";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const staffFormSchema = z
    .object({
        name: z.string().trim().min(1, "Staff full name is required."),
        role: z.string().trim().min(1, "Role is required."),
        preparationStationId: z.string().optional().or(z.literal("")),
        stationCode: z.string().optional().or(z.literal("")),
        phone: z.string().trim().optional(),
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
        active: z.boolean(),
        /** Per weekday: shift definition id, or "" for off */
        dayShiftByDay: z.record(z.string(), z.string()),
        /** Tables assigned per shift window id */
        assignedTablesByShift: z.record(z.string(), z.array(z.string())),
        /** Which shift's floor map is being edited */
        coverageShiftId: z.string().optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
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
): Array<{ shiftDefinitionId: string; tableIds: string[] }> {
    const used = [
        ...new Set(
            WEEKDAYS.map(day => dayShiftByDay[day] || "").filter(Boolean),
        ),
    ];
    return used.map(shiftDefinitionId => ({
        shiftDefinitionId,
        tableIds: assignedTablesByShift[shiftDefinitionId] || [],
    }));
}

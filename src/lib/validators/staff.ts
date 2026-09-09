import { z } from "zod";
import { ROLES } from "@/domains/identity/domain/role";

const staffRoleValues = ROLES.filter(role => role !== "super_admin") as [
    Exclude<(typeof ROLES)[number], "super_admin">,
    ...Exclude<(typeof ROLES)[number], "super_admin">[],
];

export const staffFormSchema = z
    .object({
        name: z.string().trim().min(1, "Staff full name is required."),
        role: z.enum(staffRoleValues),
        phone: z.string().trim().optional(),
        email: z.union([
            z.literal(""),
            z.string().trim().email("Enter a valid email."),
        ]),
        pin: z
            .string()
            .trim()
            .min(4, "PIN must be 4–6 digits.")
            .max(6, "PIN must be 4–6 digits.")
            .regex(/^\d+$/, "PIN must be numeric."),
        active: z.boolean(),
        shiftStatus: z.enum(["on_duty", "on_break", "off_duty"]),
        workingDays: z
            .array(z.string())
            .min(1, "Select at least one working day."),
        shiftDefinitionId: z.string().optional().or(z.literal("")),
        assignedTableIds: z.array(z.string()),
    })
    .superRefine((data, ctx) => {
        if (data.role === "waiter" && !data.shiftDefinitionId) {
            ctx.addIssue({
                code: "custom",
                path: ["shiftDefinitionId"],
                message: "Select a shift to assign floor tables.",
            });
        }
    });

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const staffFormDefaults: StaffFormValues = {
    name: "",
    role: "waiter",
    phone: "",
    email: "",
    pin: "1234",
    active: true,
    shiftStatus: "on_duty",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    shiftDefinitionId: "",
    assignedTableIds: [],
};

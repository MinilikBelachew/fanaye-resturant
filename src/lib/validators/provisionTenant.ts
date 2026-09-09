import { z } from "zod";

const etPhone = z
    .string()
    .trim()
    .min(9, "Enter a valid phone number.")
    .refine(value => {
        const digits = value.replace(/\D/g, "");
        return (
            digits.length >= 9 &&
            (digits.startsWith("251") ||
                digits.startsWith("09") ||
                digits.startsWith("9") ||
                digits.startsWith("07") ||
                digits.startsWith("7"))
        );
    }, "Use an Ethiopian mobile number (+251 9X XXX XXXX).");

export const provisionCompanySchema = z.object({
    name: z.string().trim().min(2, "Brand name is required."),
    legalName: z.string().trim().optional().or(z.literal("")),
    concept: z.string().trim().min(1, "Select a concept."),
    planCode: z.enum(["STARTER", "PRO", "GROWTH", "ENTERPRISE"]),
});

export const provisionLocationSchema = z.object({
    branchName: z.string().trim().min(2, "Branch name is required."),
    branchCode: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required."),
    area: z.string().trim().min(1, "Area is required."),
    address: z.string().trim().min(2, "Address is required."),
    hours: z.string().trim().min(1, "Hours are required."),
});

export const provisionManagerSchema = z.object({
    managerName: z.string().trim().min(2, "Manager name is required."),
    managerEmail: z
        .union([
            z.literal(""),
            z.string().trim().email("Enter a valid email."),
        ])
        .optional(),
    managerPhone: etPhone,
    managerPassword: z
        .string()
        .min(6, "Password must be at least 6 characters."),
});

export const provisionOpsSchema = z.object({
    tableCount: z.coerce
        .number()
        .int()
        .min(1, "At least 1 table.")
        .max(60, "Max 60 tables."),
    activeStations: z
        .array(z.string())
        .min(1, "Select at least one KDS station."),
});

export const provisionTenantSchema = provisionCompanySchema
    .and(provisionLocationSchema)
    .and(provisionManagerSchema)
    .and(provisionOpsSchema);

export type ProvisionTenantValues = z.infer<typeof provisionTenantSchema>;

export const editTenantSchema = z.object({
    name: z.string().trim().min(2, "Brand name is required."),
    legalName: z.string().trim().optional().or(z.literal("")),
    concept: z.string().trim().min(1, "Select a concept."),
    planCode: z.enum(["STARTER", "PRO", "GROWTH", "ENTERPRISE"]),
    branchName: z.string().trim().min(2, "Branch name is required."),
    branchCode: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required."),
    area: z.string().trim().min(1, "Area is required."),
    address: z.string().trim().min(2, "Address is required."),
    hours: z.string().trim().min(1, "Hours are required."),
    managerName: z.string().trim().min(2, "Manager name is required."),
    managerEmail: z
        .union([
            z.literal(""),
            z.string().trim().email("Enter a valid email."),
        ])
        .optional(),
    managerPhone: etPhone,
    managerPassword: z
        .union([
            z.literal(""),
            z.string().min(6, "Password must be at least 6 characters."),
        ])
        .optional(),
});

export type EditTenantValues = z.infer<typeof editTenantSchema>;

export const provisionTenantDefaults: ProvisionTenantValues = {
    name: "",
    legalName: "",
    concept: "Casual Dining",
    planCode: "PRO",
    branchName: "",
    branchCode: "",
    city: "Addis Ababa",
    area: "Bole",
    address: "",
    hours: "08:00 – 23:00",
    managerName: "",
    managerEmail: "",
    managerPhone: "+251 9",
    managerPassword: "Password123!",
    tableCount: 16,
    activeStations: ["KITCHEN", "BARISTA", "CAKES", "SOFT_DRINKS"],
};

/** Format Ethiopian mobile as +251 9X XXX XXXX while typing. */
export function maskEthiopianPhone(input: string): string {
    let digits = input.replace(/\D/g, "");

    if (digits.startsWith("0")) {
        digits = `251${digits.slice(1)}`;
    } else if (digits.startsWith("9") && digits.length <= 9) {
        digits = `251${digits}`;
    } else if (digits.startsWith("7") && digits.length <= 9) {
        digits = `251${digits}`;
    }

    if (!digits.startsWith("251")) {
        digits = `251${digits}`;
    }

    digits = digits.slice(0, 12); // 251 + 9 digits

    const rest = digits.slice(3);
    if (rest.length === 0) return "+251 ";
    if (rest.length <= 2) return `+251 ${rest}`;
    if (rest.length <= 5) return `+251 ${rest.slice(0, 2)} ${rest.slice(2)}`;
    return `+251 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
}

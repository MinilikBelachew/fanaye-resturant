import { z } from "zod";

const etPhone = z
    .string()
    .trim()
    .refine(value => {
        const digits = value.replace(/\D/g, "");
        return digits.length === 12 && /^251[79]\d{8}$/.test(digits);
    }, "Enter a full Ethiopian mobile (+251 9X XXX XXXX).");

const tempPassword = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number.");

export const provisionCompanySchema = z.object({
    name: z.string().trim().min(2, "Brand name is required."),
    legalName: z.string().trim().optional().or(z.literal("")),
    concept: z.string().trim().min(1, "Select a concept."),
    planCode: z.string().trim().min(1, "Select a plan."),
});

export const provisionLocationSchema = z.object({
    branchName: z.string().trim().min(2, "Branch name is required."),
    branchCode: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required."),
    area: z.string().trim().min(1, "Area is required."),
    address: z.string().trim().min(2, "Address is required."),
    hours: z.string().trim().min(1, "Hours are required."),
    serviceMode: z.enum(["RESTAURANT", "BAKERY"]).default("RESTAURANT"),
});

export const provisionManagerSchema = z.object({
    ownerName: z.string().trim().min(2, "Owner name is required."),
    ownerEmail: z
        .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
        .optional(),
    ownerPhone: etPhone,
    ownerPassword: tempPassword,
    managerName: z.string().trim().min(2, "Manager name is required."),
    managerEmail: z
        .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
        .optional(),
    managerPhone: etPhone,
    managerPassword: tempPassword,
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
    planCode: z.string().trim().min(1, "Select a plan."),
    branchName: z.string().trim().min(2, "Branch name is required."),
    branchCode: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required."),
    area: z.string().trim().min(1, "Area is required."),
    address: z.string().trim().min(2, "Address is required."),
    hours: z.string().trim().min(1, "Hours are required."),
    managerName: z.string().trim().min(2, "Manager name is required."),
    managerEmail: z
        .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
        .optional(),
    managerPhone: etPhone,
    managerPassword: z.union([z.literal(""), tempPassword]).optional(),
});

export type EditTenantValues = z.infer<typeof editTenantSchema>;

export const createBranchFormSchema = z.object({
    name: z.string().trim().min(2, "Branch name is required."),
    displayCode: z.string().trim().optional().or(z.literal("")),
    tableCount: z.coerce
        .number()
        .int()
        .min(0, "Tables cannot be negative.")
        .max(60, "Max 60 tables."),
    copyFromBranchId: z.string().optional().or(z.literal("")),
    serviceMode: z.enum(["RESTAURANT", "BAKERY"]).default("RESTAURANT"),
    managerName: z.string().trim().min(2, "Manager name is required."),
    managerEmail: z
        .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
        .optional(),
    managerPhone: etPhone,
    managerPassword: tempPassword,
});

export type CreateBranchFormValues = z.infer<typeof createBranchFormSchema>;

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
    serviceMode: "RESTAURANT",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "+251 ",
    ownerPassword: "",
    managerName: "",
    managerEmail: "",
    managerPhone: "+251 ",
    managerPassword: "",
    tableCount: 16,
    activeStations: ["KITCHEN", "BARISTA", "CAKES", "SOFT_DRINKS"],
};

/** Format Ethiopian mobile as +251 9X XXX XXXX while typing. */
export function nationalEthiopianDigits(input: string): string {
    let digits = input.replace(/\D/g, "");

    if (digits.startsWith("251")) {
        digits = digits.slice(3);
    } else if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 9);
}

export function maskEthiopianPhone(input: string): string {
    const rest = nationalEthiopianDigits(input);
    if (rest.length === 0) return "+251 ";
    if (rest.length <= 2) return `+251 ${rest}`;
    if (rest.length <= 5) return `+251 ${rest.slice(0, 2)} ${rest.slice(2)}`;
    return `+251 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
}

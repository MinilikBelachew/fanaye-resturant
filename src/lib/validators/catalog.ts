import { z } from "zod";

export const menuItemFormSchema = z.object({
    name: z.string().trim().min(1, "Item name is required."),
    description: z.string().trim().optional().or(z.literal("")),
    price: z
        .string()
        .trim()
        .min(1, "Price is required.")
        .refine(value => !Number.isNaN(Number(value)) && Number(value) >= 0, {
            message: "Enter a valid price.",
        }),
    stationId: z.string().min(1, "Select a preparation station."),
    category: z.string().trim().optional().or(z.literal("")),
    expectedPrepMinutes: z.coerce
        .number()
        .int()
        .min(1, "Prep time must be at least 1 minute.")
        .max(180, "Prep time looks too high."),
    available: z.boolean(),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

export const modifierGroupFormSchema = z.object({
    name: z.string().trim().min(1, "Group name is required."),
    kind: z.enum(["included", "extra", "choice"]),
    options: z
        .array(
            z.object({
                id: z.string(),
                name: z.string().min(1),
                ticketLabel: z.string().min(1),
                priceDelta: z.number(),
            }),
        )
        .min(1, "Add at least one option."),
});

export type ModifierGroupFormValues = z.infer<typeof modifierGroupFormSchema>;

export const modifierOptionDraftSchema = z.object({
    name: z.string().trim().min(1, "Option name is required."),
    priceDelta: z.coerce.number().min(0, "Price cannot be negative."),
});

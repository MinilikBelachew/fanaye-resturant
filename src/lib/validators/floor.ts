import { z } from "zod";

const timeLocal = z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use time like 07:00.");

export const shiftDefinitionSchema = z.object({
    name: z.string().trim().min(1, "Shift name is required."),
    startLocalTime: timeLocal,
    endLocalTime: timeLocal,
});

export type ShiftDefinitionFormValues = z.infer<typeof shiftDefinitionSchema>;

export const placeSchema = z.object({
    name: z.string().trim().min(1, "Place name is required."),
});

export type PlaceFormValues = z.infer<typeof placeSchema>;

export const diningTableCreateSchema = z.object({
    displayName: z.string().trim().min(1, "Table name is required."),
    displayNumber: z.string().trim().optional().or(z.literal("")),
    locationId: z.string().min(1, "Select a place."),
    assignedWaiterMembershipId: z.string().optional().or(z.literal("")),
});

export type DiningTableCreateValues = z.infer<typeof diningTableCreateSchema>;

export const diningTableEditSchema = z.object({
    displayName: z.string().trim().min(1, "Table name is required."),
    locationId: z.string().min(1, "Select a place."),
    assignedWaiterMembershipId: z.string().optional().or(z.literal("")),
});

export type DiningTableEditValues = z.infer<typeof diningTableEditSchema>;

export const tableCoverageSchema = z.object({
    shiftDefinitionId: z.string().min(1, "Select a shift."),
    tableIds: z.array(z.string()),
});

export type TableCoverageFormValues = z.infer<typeof tableCoverageSchema>;

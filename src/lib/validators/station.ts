import { z } from "zod";

export const stationFormSchema = z.object({
    name: z.string().trim().min(1, "Station name is required."),
    code: z.string().trim().optional().or(z.literal("")),
    description: z.string().trim().optional().or(z.literal("")),
    category: z.string().trim().min(1, "Category is required."),
    color: z.string().min(1),
    avgPrepMin: z
        .number()
        .int()
        .min(1, "Prep time must be at least 1 minute.")
        .max(120, "Prep time looks too high."),
    enabled: z.boolean(),
});

export type StationFormValues = z.infer<typeof stationFormSchema>;

export const stationFormDefaults: StationFormValues = {
    name: "",
    code: "",
    description: "",
    category: "Hot Food",
    color: "#e85d04",
    avgPrepMin: 10,
    enabled: true,
};

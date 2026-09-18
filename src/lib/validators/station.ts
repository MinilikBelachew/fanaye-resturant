import { z } from "zod";

export const stationFormSchema = z.object({
    name: z.string().trim().min(1, "Station name is required."),
    code: z.string().trim().optional().or(z.literal("")),
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
    avgPrepMin: 10,
    enabled: true,
};

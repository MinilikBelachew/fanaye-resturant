import { toast as sonnerToast } from "sonner";

export const toast = {
    success(message: string, description?: string) {
        sonnerToast.success(message, description ? { description } : undefined);
    },
    error(message: string, description?: string) {
        sonnerToast.error(message, description ? { description } : undefined);
    },
    info(message: string, description?: string) {
        sonnerToast.message(message, description ? { description } : undefined);
    },
    fromUnknown(
        err: unknown,
        fallback = "Something went wrong. Try again.",
    ) {
        if (err && typeof err === "object") {
            const data = (err as { data?: { message?: string; code?: string } })
                .data;
            if (data?.message) {
                sonnerToast.error(data.message);
                return;
            }
            if (data?.code) {
                sonnerToast.error(fallback, { description: data.code });
                return;
            }
        }
        sonnerToast.error(fallback);
    },
};

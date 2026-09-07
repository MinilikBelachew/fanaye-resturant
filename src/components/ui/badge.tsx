import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
    {
        variants: {
            variant: {
                default: "border-transparent bg-accent text-accent-foreground",
                secondary:
                    "border-transparent bg-secondary text-slate-gray",
                outline: "border-hairline text-slate-gray",
                success:
                    "border-transparent bg-[#e8f6ee] text-[#046645]",
                warning:
                    "border-transparent bg-[#fff4e5] text-[#c2410c]",
                danger: "border-transparent bg-destructive/10 text-destructive",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({
    className,
    variant,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };

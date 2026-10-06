"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    maskEthiopianPhone,
    nationalEthiopianDigits,
} from "@/lib/validators/provisionTenant";

type EthiopianPhoneInputProps = Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "type"
> & {
    value?: string;
    onChange: (value: string) => void;
};

export const EthiopianPhoneInput = React.forwardRef<
    HTMLInputElement,
    EthiopianPhoneInputProps
>(function EthiopianPhoneInput(
    {
        value = "",
        onChange,
        className,
        disabled,
        onBlur,
        name,
        id,
        "aria-invalid": ariaInvalid,
        ...props
    },
    ref,
) {
    const national = formatNational(nationalEthiopianDigits(value));

    return (
        <div
            className={cn(
                "flex h-9 w-full overflow-hidden rounded-[10px] border border-hairline bg-card",
                "focus-within:border-foreground/30 focus-within:ring-[3px] focus-within:ring-foreground/10",
                ariaInvalid && "border-destructive",
                disabled && "pointer-events-none opacity-50",
                className,
            )}
        >
            <span className="flex shrink-0 items-center border-r border-hairline bg-secondary/50 px-2.5 font-mono text-[12px] text-slate-gray select-none">
                +251
            </span>
            <input
                {...props}
                id={id}
                name={name}
                ref={ref}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                disabled={disabled}
                aria-invalid={ariaInvalid}
                value={national}
                placeholder="9X XXX XXXX"
                onBlur={onBlur}
                onChange={e => onChange(maskEthiopianPhone(e.target.value))}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-[13px] outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
});

function formatNational(digits: string) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

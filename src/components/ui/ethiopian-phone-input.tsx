"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { nationalEthiopianDigits } from "@/lib/validators/provisionTenant";

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
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const national = formatNational(nationalEthiopianDigits(value));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const rawValue = input.value;
        const currentCursor = input.selectionStart ?? rawValue.length;

        // Count how many non-space digits were BEFORE the cursor before formatting
        const digitsBeforeCursor = rawValue
            .slice(0, currentCursor)
            .replace(/\D/g, "").length;

        // Extract pure national digits (max 9 digits)
        const newDigits = nationalEthiopianDigits(rawValue);
        const formatted = formatNational(newDigits);

        // Find the matching cursor position in the formatted text so the cursor never jumps to the end
        let newCursor = 0;
        let count = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) {
                count++;
            }
            if (count >= digitsBeforeCursor) {
                newCursor = i + 1;
                break;
            }
        }
        if (digitsBeforeCursor === 0) {
            newCursor = 0;
        }

        // Notify parent with the full E.164 formatted string
        if (newDigits.length === 0) {
            onChange("");
        } else {
            onChange(`+251 ${formatted}`);
        }

        // Maintain cursor position across React re-renders
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(newCursor, newCursor);
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            const input = e.currentTarget;
            const start = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? 0;

            // When cursor is immediately after a space, delete the digit before the space
            if (start === end && start > 0 && input.value[start - 1] === " ") {
                e.preventDefault();
                const raw = input.value;
                const before = raw.slice(0, start - 2);
                const after = raw.slice(start);
                const updated = before + after;
                const newDigits = nationalEthiopianDigits(updated);
                const formatted = formatNational(newDigits);
                const digitsBefore = before.replace(/\D/g, "").length;

                let newCursor = 0;
                let count = 0;
                for (let i = 0; i < formatted.length; i++) {
                    if (/\d/.test(formatted[i])) count++;
                    if (count >= digitsBefore) {
                        newCursor = i + 1;
                        break;
                    }
                }
                if (digitsBefore === 0) newCursor = 0;

                if (newDigits.length === 0) {
                    onChange("");
                } else {
                    onChange(`+251 ${formatted}`);
                }

                requestAnimationFrame(() => {
                    if (inputRef.current) {
                        inputRef.current.setSelectionRange(
                            newCursor,
                            newCursor,
                        );
                    }
                });
            }
        }
    };

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
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                disabled={disabled}
                aria-invalid={ariaInvalid}
                value={national}
                placeholder="9X XXX XXXX"
                onBlur={onBlur}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
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

"use client";

import { useMemo } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useListCompatibleInventoryUnitsQuery } from "@/context/services/inventoryApi";

export function UnitPicker({
    baseUnit,
    value,
    onChange,
    disabled,
    error,
    compact,
    className,
}: {
    /** The ingredient's stock (base) unit — the picker shows units compatible with it. */
    baseUnit: string;
    value: string;
    onChange: (unit: string) => void;
    disabled?: boolean;
    error?: string;
    compact?: boolean;
    className?: string;
}) {
    const { data, isLoading } = useListCompatibleInventoryUnitsQuery(
        { baseUnit },
        { skip: !baseUnit },
    );
    const options = useMemo(() => {
        const units = data?.data ?? [];
        const codes = new Set(units.map(u => u.code));
        if (!codes.has(baseUnit)) {
            return [
                ...units,
                {
                    id: `base:${baseUnit}`,
                    code: baseUnit,
                    name: baseUnit,
                    category: "",
                    sortOrder: 0,
                    isBuiltIn: true,
                    tenantId: null,
                },
            ];
        }
        return units;
    }, [data, baseUnit]);

    if (!baseUnit) {
        return <span className="text-[12px] text-slate-gray">—</span>;
    }

    return (
        <Select
            value={value || baseUnit}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger
                className={cn(
                    compact
                        ? "h-9 w-24 rounded-lg px-2.5 text-[12px]"
                        : "h-10 w-full rounded-xl border-hairline bg-background px-3 text-[13px]",
                    "shadow-none",
                    error && "border-rose-400 focus-visible:ring-rose-200",
                    className,
                )}
                title={options.find(o => o.code === (value || baseUnit))?.name}
            >
                <SelectValue placeholder={isLoading ? "…" : baseUnit} />
            </SelectTrigger>
            <SelectContent
                align="start"
                className="max-h-72 rounded-xl border-hairline"
            >
                {options.map(opt => (
                    <SelectPrimitive.Item
                        key={opt.id}
                        value={opt.code}
                        className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                            <SelectPrimitive.ItemIndicator>
                                <CheckIcon className="size-4" />
                            </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>
                            {opt.code}
                        </SelectPrimitive.ItemText>
                        {opt.name && opt.name !== opt.code ? (
                            <span className="ml-auto text-[11px] text-slate-gray">
                                {opt.name}
                            </span>
                        ) : null}
                    </SelectPrimitive.Item>
                ))}
            </SelectContent>
        </Select>
    );
}

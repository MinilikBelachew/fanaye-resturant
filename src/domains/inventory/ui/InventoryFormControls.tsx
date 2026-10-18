"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SelectOption = {
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
};

export function InventoryNiceSelect({
    value,
    placeholder,
    options,
    onChange,
    disabled,
    error,
}: {
    value: string;
    placeholder: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    error?: string;
}) {
    return (
        <div className="space-y-1">
            <Select
                value={value || undefined}
                onValueChange={onChange}
                disabled={disabled}
            >
                <SelectTrigger
                    className={cn(
                        "h-10 w-full rounded-xl border-hairline bg-background px-3 text-[13px] shadow-none",
                        error && "border-rose-400 focus-visible:ring-rose-200",
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    align="start"
                    className="max-h-72 rounded-xl border-hairline"
                >
                    {options.map(opt => (
                        <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                            className="rounded-lg text-[13px]"
                        >
                            <span className="flex w-full items-center justify-between gap-3">
                                <span>{opt.label}</span>
                                {opt.hint ? (
                                    <span className="text-[11px] text-slate-gray">
                                        {opt.hint}
                                    </span>
                                ) : null}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error ? (
                <p className="text-[11px] text-rose-600">{error}</p>
            ) : null}
        </div>
    );
}

export function InventoryMultiSelect({
    placeholder,
    searchPlaceholder,
    emptyLabel,
    selectedCountLabel,
    options,
    selectedIds,
    onToggle,
    error,
}: {
    placeholder: string;
    searchPlaceholder: string;
    emptyLabel: string;
    selectedCountLabel: (count: number) => string;
    options: SelectOption[];
    selectedIds: Set<string>;
    onToggle: (value: string) => void;
    error?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return options;
        return options.filter(
            o =>
                o.label.toLowerCase().includes(needle) ||
                (o.hint ?? "").toLowerCase().includes(needle),
        );
    }, [options, q]);

    const count = selectedIds.size;

    return (
        <div ref={rootRef} className="relative space-y-1">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
                className={cn(
                    "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-hairline bg-background px-3 text-left text-[13px] transition-colors",
                    open && "border-foreground/30 ring-2 ring-brand/20",
                    error && "border-rose-400",
                )}
            >
                <span
                    className={cn(
                        "truncate",
                        count === 0 ? "text-slate-gray" : "text-foreground",
                    )}
                >
                    {count === 0 ? placeholder : selectedCountLabel(count)}
                </span>
                <ChevronDown
                    className={cn(
                        "size-4 shrink-0 text-slate-gray transition-transform",
                        open && "rotate-180",
                    )}
                />
            </button>
            {error ? (
                <p className="text-[11px] text-rose-600">{error}</p>
            ) : null}

            {open ? (
                <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-hairline bg-card shadow-lg">
                    <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
                        <Search className="size-3.5 shrink-0 text-slate-gray" />
                        <input
                            autoFocus
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-slate-gray"
                        />
                    </div>
                    <ul className="max-h-56 overflow-y-auto p-1">
                        {filtered.map(opt => {
                            const checked = selectedIds.has(opt.value);
                            return (
                                <li key={opt.value}>
                                    <button
                                        type="button"
                                        disabled={opt.disabled}
                                        onClick={() => onToggle(opt.value)}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                                            opt.disabled
                                                ? "cursor-not-allowed opacity-40"
                                                : "hover:bg-secondary",
                                            checked && "bg-secondary/70",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex size-4 shrink-0 items-center justify-center rounded border",
                                                checked
                                                    ? "border-brand bg-brand text-white"
                                                    : "border-hairline bg-background",
                                            )}
                                        >
                                            {checked ? (
                                                <Check className="size-3" />
                                            ) : null}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate font-medium">
                                            {opt.label}
                                        </span>
                                        {opt.hint ? (
                                            <span className="shrink-0 tabular-nums text-[11px] text-slate-gray">
                                                {opt.hint}
                                            </span>
                                        ) : null}
                                    </button>
                                </li>
                            );
                        })}
                        {filtered.length === 0 ? (
                            <li className="px-3 py-6 text-center text-[12px] text-slate-gray">
                                {emptyLabel}
                            </li>
                        ) : null}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

export function QtyLineCard({
    title,
    hint,
    quantity,
    unit,
    onQuantityChange,
    onRemove,
    removeLabel,
    quantityPlaceholder,
    error,
    max,
}: {
    title: string;
    hint?: string;
    quantity: string;
    unit: string;
    onQuantityChange: (v: string) => void;
    onRemove: () => void;
    removeLabel: string;
    quantityPlaceholder: string;
    error?: string;
    max?: number;
}) {
    return (
        <li className="rounded-xl border border-hairline bg-card px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{title}</p>
                    {hint ? (
                        <p className="text-[11px] text-slate-gray">{hint}</p>
                    ) : null}
                </div>
                <input
                    type="number"
                    min="0"
                    max={max}
                    step="any"
                    value={quantity}
                    onChange={e => onQuantityChange(e.target.value)}
                    placeholder={quantityPlaceholder}
                    className={cn(
                        "h-9 w-24 rounded-lg border bg-background px-2.5 text-[13px] tabular-nums",
                        error ? "border-rose-400" : "border-hairline",
                    )}
                />
                <span className="text-[12px] text-slate-gray">{unit}</span>
                <button
                    type="button"
                    aria-label={removeLabel}
                    className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                    onClick={onRemove}
                >
                    <X className="size-4" />
                </button>
            </div>
            {error ? (
                <p className="mt-1 text-[11px] text-rose-600">{error}</p>
            ) : null}
        </li>
    );
}

export function PrimaryActionButton({
    children,
    disabled,
    loading,
    type = "submit",
    onClick,
    className,
}: {
    children: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    type?: "submit" | "button";
    onClick?: () => void;
    className?: string;
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45",
                className,
            )}
        >
            {children}
        </button>
    );
}

/** Positive finite number > 0 */
export function parsePositiveQty(raw: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
}

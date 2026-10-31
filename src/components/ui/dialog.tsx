"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
    open: false,
});

export function Dialog({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {open ? children : null}
        </DialogContext.Provider>
    );
}

export function DialogContent({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    const { onOpenChange } = React.useContext(DialogContext);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => onOpenChange?.(false)}
        >
            <div
                className={cn(
                    "relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-hairline bg-card p-6 shadow-2xl",
                    className,
                )}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogHeader({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    const { onOpenChange } = React.useContext(DialogContext);
    return (
        <div className={cn("flex items-center justify-between pb-3 border-b border-hairline/80", className)}>
            <div className="space-y-1">{children}</div>
            <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
                <X className="size-4" />
            </button>
        </div>
    );
}

export function DialogTitle({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <h3 className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)}>
            {children}
        </h3>
    );
}

export function DialogFooter({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex items-center justify-end gap-2 pt-3 border-t border-hairline/80", className)}>
            {children}
        </div>
    );
}


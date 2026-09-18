"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    WEBSITE_TEMPLATES,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";

export default function WebsiteTemplatePicker({
    tenantName,
    busy,
    onApply,
    onScratch,
    onCancel,
}: {
    tenantName: string;
    busy?: boolean;
    onApply: (id: WebsiteTemplateId, action: "customize" | "publish") => void;
    onScratch: () => void;
    onCancel?: () => void;
}) {
    const [selected, setSelected] = useState<WebsiteTemplateId>(
        WEBSITE_TEMPLATES[0].id,
    );
    const active = WEBSITE_TEMPLATES.find(t => t.id === selected)!;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                    <p className="text-[12px] font-medium tracking-[0.14em] text-slate-gray uppercase">
                        Website templates
                    </p>
                    <h1 className="text-[26px] font-semibold tracking-tight sm:text-[30px]">
                        {tenantName}
                    </h1>
                    <p className="max-w-xl text-[14px] leading-relaxed text-slate-gray">
                        Choose a restaurant layout. Your name and live menu
                        apply automatically.
                    </p>
                </div>
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="self-start text-[13px] font-medium text-slate-gray underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                        Back to editor
                    </button>
                ) : null}
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WEBSITE_TEMPLATES.map(template => {
                    const isOn = selected === template.id;
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => setSelected(template.id)}
                            className={cn(
                                "overflow-hidden rounded-2xl border text-left transition-all",
                                isOn
                                    ? "border-foreground/80 shadow-sm"
                                    : "border-hairline hover:border-foreground/30",
                            )}
                        >
                            <div className="relative aspect-[5/3] overflow-hidden bg-secondary">
                                <img
                                    src={template.previewImage}
                                    alt=""
                                    className="size-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                {isOn ? (
                                    <span className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                                        <Check className="size-3.5 stroke-[2.5]" />
                                    </span>
                                ) : null}
                                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                    <p className="text-[14px] font-semibold">
                                        {template.name}
                                    </p>
                                    <p className="text-[11px] text-white/80">
                                        {template.tagline}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={busy}
                    onClick={onScratch}
                    className="flex aspect-[5/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-card text-center transition-colors hover:border-foreground/40 hover:bg-secondary/40 disabled:opacity-50 sm:aspect-auto sm:min-h-[140px] lg:col-span-1"
                >
                    <Sparkles className="size-5 text-slate-gray" />
                    <span className="text-[14px] font-semibold">
                        Start from scratch
                    </span>
                    <span className="px-4 text-[12px] text-slate-gray">
                        Blank header, hero, footer
                    </span>
                </button>
            </div>

            <div className="sticky bottom-3 z-10 overflow-hidden rounded-2xl border border-hairline bg-card/95 shadow-lg backdrop-blur-md">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">
                            {active.name}
                        </p>
                        <p className="truncate text-[12px] text-slate-gray">
                            {active.vibe}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            className="h-10 gap-2 rounded-full px-4 text-[13px]"
                            onClick={() => onApply(selected, "publish")}
                        >
                            {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Rocket className="size-3.5" />
                            )}
                            Publish
                        </Button>
                        <Button
                            type="button"
                            disabled={busy}
                            className="h-10 gap-2 rounded-full px-4 text-[13px]"
                            onClick={() => onApply(selected, "customize")}
                        >
                            {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Pencil className="size-3.5" />
                            )}
                            Customize
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

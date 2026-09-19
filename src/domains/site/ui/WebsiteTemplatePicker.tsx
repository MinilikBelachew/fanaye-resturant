"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    WEBSITE_TEMPLATES,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";

function TemplateMock({
    templateId,
    accent,
    previewImage,
}: {
    templateId: WebsiteTemplateId;
    accent: string;
    previewImage: string;
}) {
    const isDark = templateId === "ember-kitchen";
    const isMono = templateId === "urban-plate";
    const ink = isDark ? "#f8fafc" : isMono ? "#09090b" : "#0f172a";
    const paper = isDark ? "#0b1120" : "#ffffff";
    const mute = isDark ? "rgba(248,250,252,0.45)" : "rgba(15,23,42,0.35)";

    return (
        <div
            className="relative aspect-[16/11] overflow-hidden"
            style={{ background: isDark ? "#020617" : "#e2e8f0" }}
        >
            <img
                src={previewImage}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
                className="absolute inset-0"
                style={{
                    background: isDark
                        ? "linear-gradient(180deg, rgba(2,6,23,0.35) 0%, rgba(2,6,23,0.82) 100%)"
                        : "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.55) 100%)",
                }}
            />

            {/* Mini site chrome */}
            <div className="absolute inset-x-3 top-3 bottom-3 flex flex-col overflow-hidden rounded-[14px] border border-white/25 bg-white/10 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.55)] backdrop-blur-[2px]">
                <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ background: paper, color: ink }}
                >
                    <span
                        className="text-[9px] font-semibold tracking-[0.14em] uppercase"
                        style={{ opacity: 0.85 }}
                    >
                        Fanaye
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span
                            className="hidden h-1 w-6 rounded-full sm:block"
                            style={{ background: mute }}
                        />
                        <span
                            className="hidden h-1 w-6 rounded-full sm:block"
                            style={{ background: mute }}
                        />
                        <span
                            className="rounded-full px-2 py-0.5 text-[8px] font-semibold text-white"
                            style={{ background: accent }}
                        >
                            Menu
                        </span>
                    </div>
                </div>

                <div className="relative min-h-0 flex-1 overflow-hidden">
                    <img
                        src={previewImage}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                templateId === "harbor-bistro" ||
                                templateId === "ember-kitchen"
                                    ? "linear-gradient(90deg, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.15) 70%)"
                                    : "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 100%)",
                        }}
                    />
                    <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3">
                        <div
                            className="h-2.5 w-[42%] rounded-full bg-white/95"
                            style={{
                                maxWidth:
                                    templateId === "urban-plate" ? 88 : 120,
                            }}
                        />
                        <div className="h-1.5 w-[58%] rounded-full bg-white/55" />
                        <div className="flex gap-1.5 pt-1">
                            <span
                                className="h-5 rounded-full px-2 text-[8px] font-semibold leading-5 text-white"
                                style={{ background: accent }}
                            >
                                Reserve
                            </span>
                            <span className="h-5 rounded-full border border-white/40 px-2 text-[8px] font-semibold leading-5 text-white/90">
                                Menu
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                        Layout templates
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
                        {tenantName}
                    </h1>
                    <p className="max-w-xl text-[14px] leading-relaxed text-slate-500">
                        Pick a modern restaurant layout. Your name and live menu
                        wire in automatically — then publish or fine-tune.
                    </p>
                </div>
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="self-start text-[13px] font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline disabled:opacity-50"
                    >
                        Back to editor
                    </button>
                ) : null}
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {WEBSITE_TEMPLATES.map(template => {
                    const isOn = selected === template.id;
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => setSelected(template.id)}
                            className={cn(
                                "group overflow-hidden rounded-[22px] border bg-white text-left shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all duration-200",
                                isOn
                                    ? "border-slate-900 ring-2 ring-slate-900/10"
                                    : "border-slate-200/90 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]",
                            )}
                        >
                            <div className="relative">
                                <TemplateMock
                                    templateId={template.id}
                                    accent={template.accent}
                                    previewImage={template.previewImage}
                                />
                                {isOn ? (
                                    <span className="absolute top-3.5 right-3.5 z-10 flex size-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                                        <Check className="size-3.5 stroke-[2.5]" />
                                    </span>
                                ) : null}
                            </div>

                            <div className="space-y-2.5 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                                            {template.name}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-slate-500">
                                            {template.tagline}
                                        </p>
                                    </div>
                                    <span
                                        className="mt-1 size-2.5 shrink-0 rounded-full"
                                        style={{ background: template.accent }}
                                    />
                                </div>
                                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                                    {template.vibe}
                                </p>
                            </div>
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={busy}
                    onClick={onScratch}
                    className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50/80 text-center transition-all hover:border-slate-400 hover:bg-white disabled:opacity-50"
                >
                    <span className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                        <Sparkles className="size-4 text-slate-600" />
                    </span>
                    <span className="text-[14px] font-semibold text-slate-900">
                        Start from scratch
                    </span>
                    <span className="max-w-[180px] px-4 text-[12px] leading-relaxed text-slate-500">
                        Blank header, hero, and footer — build your own
                    </span>
                </button>
            </div>

            <div className="sticky bottom-3 z-10 overflow-hidden rounded-[20px] border border-slate-200/90 bg-white/95 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            className="size-9 shrink-0 rounded-[10px] bg-cover bg-center shadow-inner ring-1 ring-black/5"
                            style={{
                                backgroundImage: `url(${active.previewImage})`,
                            }}
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-slate-900">
                                {active.name}
                            </p>
                            <p className="truncate text-[12px] text-slate-500">
                                {active.vibe}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            className="h-10 gap-2 rounded-full border-slate-200 px-4 text-[13px]"
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
                            className="h-10 gap-2 rounded-full bg-slate-900 px-5 text-[13px] text-white hover:bg-slate-800"
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

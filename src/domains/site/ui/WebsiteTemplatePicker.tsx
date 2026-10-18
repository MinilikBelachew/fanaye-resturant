"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    WEBSITE_TEMPLATES,
    type WebsiteTemplateId,
} from "@/domains/site/templates/restaurantTemplates";

const TEMPLATE_I18N_KEYS: Record<
    WebsiteTemplateId,
    { name: string; tagline: string; vibe: string }
> = {
    "harbor-bistro": {
        name: "harborBistro_name",
        tagline: "harborBistro_tagline",
        vibe: "harborBistro_vibe",
    },
    "ember-kitchen": {
        name: "emberKitchen_name",
        tagline: "emberKitchen_tagline",
        vibe: "emberKitchen_vibe",
    },
    "garden-table": {
        name: "gardenTable_name",
        tagline: "gardenTable_tagline",
        vibe: "gardenTable_vibe",
    },
    "coffee-house": {
        name: "coffeeHouse_name",
        tagline: "coffeeHouse_tagline",
        vibe: "coffeeHouse_vibe",
    },
    "urban-plate": {
        name: "urbanPlate_name",
        tagline: "urbanPlate_tagline",
        vibe: "urbanPlate_vibe",
    },
};

function TemplateMock({
    templateId,
    accent,
    previewImage,
    menuLabel,
    reserveLabel,
}: {
    templateId: WebsiteTemplateId;
    accent: string;
    previewImage: string;
    menuLabel: string;
    reserveLabel: string;
}) {
    const isDark = templateId === "ember-kitchen";
    const isFineDining = templateId === "harbor-bistro";
    const isMono = templateId === "urban-plate";
    const ink = isDark ? "#f8fafc" : isMono ? "#09090b" : "#1c1917";
    const paper = isDark ? "#0b1120" : isFineDining ? "#f6f1e8" : "#ffffff";
    const mute = isDark ? "rgba(248,250,252,0.45)" : "rgba(28,25,23,0.35)";

    if (isFineDining) {
        return (
            <div
                className="relative aspect-[16/11] overflow-hidden"
                style={{ background: "#12100e" }}
            >
                <img
                    src={previewImage}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2.5">
                    <span
                        className="font-serif text-[10px] tracking-[0.14em] text-white/90"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        FINE
                    </span>
                    <span
                        className="border px-2 py-0.5 text-[7px] uppercase tracking-[0.16em] text-white/90"
                        style={{ borderColor: `${accent}99` }}
                    >
                        {reserveLabel}
                    </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10">
                    <p
                        className="max-w-[12rem] font-serif text-[15px] font-normal leading-[1.15] text-white sm:text-[17px]"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        Modern elegance
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                        <span
                            className="px-2.5 py-1 text-[7px] uppercase tracking-[0.16em] text-white"
                            style={{ background: accent }}
                        >
                            {menuLabel}
                        </span>
                        <span
                            className="h-px flex-1 max-w-[3rem]"
                            style={{ background: mute }}
                        />
                    </div>
                </div>
            </div>
        );
    }

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
            <div className="absolute inset-x-3 top-3 bottom-3 flex flex-col overflow-hidden rounded-[14px] border border-white/25 bg-white/10 backdrop-blur-[2px]">
                <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ background: paper, color: ink }}
                >
                    <span
                        className="text-[9px] font-normal tracking-[0.18em] uppercase"
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
                            className="rounded-full px-2 py-0.5 text-[8px] font-normal text-white"
                            style={{ background: accent }}
                        >
                            {menuLabel}
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
                                className="h-5 rounded-full px-2 text-[8px] font-normal leading-5 text-white"
                                style={{ background: accent }}
                            >
                                {reserveLabel}
                            </span>
                            <span className="h-5 rounded-full border border-white/40 px-2 text-[8px] font-normal leading-5 text-white/90">
                                {menuLabel}
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
    const t = useTranslations("websiteStudio");
    const [selected, setSelected] = useState<WebsiteTemplateId>(
        WEBSITE_TEMPLATES[0].id,
    );
    const active = WEBSITE_TEMPLATES.find(tpl => tpl.id === selected)!;
    const activeKeys = TEMPLATE_I18N_KEYS[active.id];

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <p className="text-[11px] font-normal tracking-[0.16em] text-steel-gray uppercase">
                        {t("layoutTemplates")}
                    </p>
                    <h1 className="text-[26px] font-normal tracking-tight text-foreground sm:text-[30px]">
                        {tenantName}
                    </h1>
                    <p className="max-w-xl text-[13px] leading-relaxed text-slate-gray font-normal">
                        {t("pickLayoutDesc")}
                    </p>
                </div>
                {onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="self-start text-[13px] font-normal text-slate-gray underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50 cursor-pointer"
                    >
                        {t("backToEditor")}
                    </button>
                ) : null}
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {WEBSITE_TEMPLATES.map(template => {
                    const isOn = selected === template.id;
                    const keys = TEMPLATE_I18N_KEYS[template.id];
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => setSelected(template.id)}
                            className={cn(
                                "group overflow-hidden rounded-[20px] border bg-card text-left transition-all duration-200 cursor-pointer",
                                isOn
                                    ? "border-brand ring-1 ring-brand/30"
                                    : "border-hairline hover:border-slate-gray/40 hover:-translate-y-0.5",
                            )}
                        >
                            <div className="relative">
                                <TemplateMock
                                    templateId={template.id}
                                    accent={template.accent}
                                    previewImage={template.previewImage}
                                    menuLabel={t("mockMenu")}
                                    reserveLabel={t("mockReserve")}
                                />
                                {isOn ? (
                                    <span className="absolute top-3 right-3 z-10 flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xs">
                                        <Check className="size-3.5 stroke-[2]" />
                                    </span>
                                ) : null}
                            </div>

                            <div className="space-y-2 p-3.5 sm:p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[14px] font-normal tracking-tight text-foreground">
                                            {t(keys.name)}
                                        </p>
                                        <p className="mt-0.5 text-[12px] text-slate-gray font-normal">
                                            {t(keys.tagline)}
                                        </p>
                                    </div>
                                    <span
                                        className="mt-1 size-2.5 shrink-0 rounded-full"
                                        style={{ background: template.accent }}
                                    />
                                </div>
                                <p className="line-clamp-2 text-[11px] leading-relaxed text-steel-gray font-normal">
                                    {t(keys.vibe)}
                                </p>
                            </div>
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={busy}
                    onClick={onScratch}
                    className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-hairline bg-surface-ivory/30 dark:bg-card/30 text-center transition-all hover:border-brand/40 hover:bg-card disabled:opacity-50 cursor-pointer"
                >
                    <span className="flex size-10 items-center justify-center rounded-full border border-hairline bg-card">
                        <Sparkles className="size-4 text-brand" />
                    </span>
                    <span className="text-[13px] font-normal text-foreground">
                        {t("startFromScratch")}
                    </span>
                    <span className="max-w-[200px] px-4 text-[11px] leading-relaxed text-slate-gray font-normal">
                        {t("startFromScratchDesc")}
                    </span>
                </button>
            </div>

            <div className="sticky bottom-3 z-10 overflow-hidden rounded-[18px] border border-hairline bg-card/95 backdrop-blur-md">
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            className="size-9 shrink-0 rounded-[10px] bg-cover bg-center ring-1 ring-border/20"
                            style={{
                                backgroundImage: `url(${active.previewImage})`,
                            }}
                        />
                        <div className="min-w-0">
                            <p className="truncate text-[14px] font-normal text-foreground">
                                {t(activeKeys.name)}
                            </p>
                            <p className="truncate text-[11px] text-slate-gray font-normal">
                                {t(activeKeys.vibe)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            className="h-9 gap-2 rounded-xl border-hairline px-4 text-[12px] font-normal"
                            onClick={() => onApply(selected, "publish")}
                        >
                            {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Rocket className="size-3.5" />
                            )}
                            {t("publish")}
                        </Button>
                        <Button
                            type="button"
                            disabled={busy}
                            className="h-9 gap-2 rounded-xl bg-brand hover:bg-brand/90 px-4 text-[12px] font-normal text-brand-foreground"
                            onClick={() => onApply(selected, "customize")}
                        >
                            {busy ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Pencil className="size-3.5" />
                            )}
                            {t("customize")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

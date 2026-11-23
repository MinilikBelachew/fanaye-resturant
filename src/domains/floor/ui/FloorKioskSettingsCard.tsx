"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    useGetFloorKioskSettingsQuery,
    usePairFloorKioskDeviceMutation,
    useUpdateFloorKioskSettingsMutation,
} from "@/context/services/floorKioskApi";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import {
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Lock,
    Save,
    TabletSmartphone,
    Unlink,
} from "lucide-react";

const KIOSK_TOKEN_KEY = "restorch_floor_kiosk_token";
const KIOSK_TENANT_KEY = "restorch_floor_kiosk_tenant_id";
const KIOSK_BRANCH_NAME_KEY = "restorch_floor_kiosk_branch_name";
const KIOSK_PAIRED_KEY = "restorch_floor_kiosk_paired";

export default function FloorKioskSettingsCard({
    branchId,
}: {
    branchId?: string;
}) {
    const t = useTranslations("floorKioskSettings");
    const router = useRouter();
    const { data, isLoading } = useGetFloorKioskSettingsQuery(
        branchId ? { branchId } : undefined,
    );
    const [updateSettings, { isLoading: isSaving }] =
        useUpdateFloorKioskSettingsMutation();
    const [pairDevice, { isLoading: isPairing }] =
        usePairFloorKioskDeviceMutation();

    const [pin, setPin] = useState("");
    const [overdueMinutes, setOverdueMinutes] = useState("3");
    const [isPairedHere, setIsPairedHere] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPairedHere(localStorage.getItem(KIOSK_PAIRED_KEY) === "1");
        }
    }, []);

    useEffect(() => {
        if (data) {
            setPin(data.floorKioskPin ?? "");
            setOverdueMinutes(String(data.readyOverdueMinutes ?? 3));
        }
    }, [data]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPin = pin.trim();
        if (trimmedPin && !/^\d{4}$/.test(trimmedPin)) {
            toast.error(t("pinValidation"));
            return;
        }
        try {
            await updateSettings({
                branchId,
                floorKioskPin: trimmedPin || null,
                readyOverdueMinutes: Math.min(
                    Math.max(Number(overdueMinutes) || 3, 1),
                    60,
                ),
            }).unwrap();
            toast.success(t("settingsSaved"));
        } catch (err: any) {
            toast.error(err?.data?.message || t("saveFailed"));
        }
    };

    const handlePairThisTablet = async () => {
        try {
            const res = await pairDevice(
                branchId ? { branchId } : undefined,
            ).unwrap();
            localStorage.setItem(KIOSK_TOKEN_KEY, res.kioskToken);
            localStorage.setItem(KIOSK_TENANT_KEY, res.tenantId);
            localStorage.setItem(KIOSK_BRANCH_NAME_KEY, res.branchName);
            localStorage.setItem(KIOSK_PAIRED_KEY, "1");
            setIsPairedHere(true);
            toast.success(t("pairedSuccess", { branchName: res.branchName }));
            router.push("/floor-kiosk");
        } catch (err: any) {
            toast.error(err?.data?.message || t("pairFailed"));
        }
    };

    const handleUnpairThisTablet = () => {
        localStorage.removeItem(KIOSK_PAIRED_KEY);
        localStorage.removeItem(KIOSK_TOKEN_KEY);
        setIsPairedHere(false);
        toast.success(t("unpairedSuccess"));
    };

    return (
        <div className="rounded-2xl border border-hairline bg-card p-5 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        <TabletSmartphone className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">
                            {t("title")}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground max-w-lg">
                            {t("description")}
                        </p>
                    </div>
                </div>

                <Link
                    href="/floor-kiosk"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-orange-500/40 hover:text-orange-600 dark:hover:text-orange-400 transition"
                >
                    <span>{t("openSharedFloor")}</span>
                    <ArrowUpRight className="size-3.5" />
                </Link>
            </div>

            {isLoading ? (
                <div className="mt-4 h-16 animate-pulse rounded-xl bg-muted/40" />
            ) : (
                <form
                    onSubmit={handleSave}
                    className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                >
                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1">
                            <Lock className="size-3" />
                            <span>{t("pinLabel")}</span>
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={pin}
                            onChange={e =>
                                setPin(
                                    e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 4),
                                )
                            }
                            placeholder={t("pinPlaceholder")}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1">
                            <Clock className="size-3" />
                            <span>{t("turnRedLabel")}</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={60}
                            value={overdueMinutes}
                            onChange={e => setOverdueMinutes(e.target.value)}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                        <Save className="size-3.5" />
                        <span>
                            {isSaving ? t("saving") : t("saveKioskPin")}
                        </span>
                    </button>
                </form>
            )}

            <div className="mt-4 pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        {t("option1Title")}
                    </span>{" "}
                    {t("option1Desc")}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isPairedHere ? (
                        <>
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>{t("tabletPaired")}</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleUnpairThisTablet}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                            >
                                <Unlink className="size-3.5" />
                                <span>{t("unpairTablet")}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            disabled={isPairing}
                            onClick={handlePairThisTablet}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                            <TabletSmartphone className="size-3.5" />
                            <span>
                                {isPairing ? t("pairing") : t("pairThisTablet")}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

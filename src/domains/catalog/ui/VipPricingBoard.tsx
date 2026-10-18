"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import {
    useUpdateAdminMenuItemMutation,
    useUpdateDefaultVipPercentMutation,
    useVipPricingQuery,
} from "@/context/services/menuApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/custom/organisms/PageHeader";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";
import { formatEtb } from "@/lib/money";
import { toast } from "@/lib/toast";

type Row = {
    id: string;
    name: string;
    categoryName: string;
    price: string;
    vipPercent: string | null;
    effectiveVipPercent: string;
    overrideDraft: string;
};

export default function VipPricingBoard() {
    const t = useTranslations("managerVipPricing");
    const { data, isLoading, isError } = useVipPricingQuery();
    const [updateDefault, { isLoading: savingDefault }] =
        useUpdateDefaultVipPercentMutation();
    const [updateItem, { isLoading: savingItem }] =
        useUpdateAdminMenuItemMutation();

    const [defaultDraft, setDefaultDraft] = useState<string | null>(null);
    const [overrideDrafts, setOverrideDrafts] = useState<
        Record<string, string>
    >({});

    const houseDefault = defaultDraft ?? data?.defaultVipPercent ?? "0.00";

    const rows: Row[] = useMemo(() => {
        const items = data?.items ?? [];
        return items.map(item => ({
            id: item.id,
            name: item.name,
            categoryName: item.categoryName,
            price: item.price,
            vipPercent: item.vipPercent,
            effectiveVipPercent: item.effectiveVipPercent,
            overrideDraft:
                overrideDrafts[item.id] ??
                (item.vipPercent != null ? item.vipPercent : ""),
        }));
    }, [data?.items, overrideDrafts]);

    async function onSaveDefault() {
        const value = Number(houseDefault);
        if (Number.isNaN(value) || value < 0) {
            toast.error(t("invalidPercent"));
            return;
        }
        try {
            await updateDefault({ defaultVipPercent: value }).unwrap();
            setDefaultDraft(null);
            toast.success(t("toastDefaultSaved"));
        } catch (err) {
            toast.fromUnknown(err, t("toastDefaultError"));
        }
    }

    async function onSaveOverride(row: Row) {
        const raw = row.overrideDraft.trim();
        let vipPercent: number | null;
        if (raw === "") {
            vipPercent = null;
        } else {
            const value = Number(raw);
            if (Number.isNaN(value) || value < 0) {
                toast.error(t("invalidPercent"));
                return;
            }
            vipPercent = value;
        }
        try {
            await updateItem({ id: row.id, body: { vipPercent } }).unwrap();
            setOverrideDrafts(prev => {
                const next = { ...prev };
                delete next[row.id];
                return next;
            });
            toast.success(t("toastOverrideSaved"), row.name);
        } catch (err) {
            toast.fromUnknown(err, t("toastOverrideError"));
        }
    }

    async function onClearOverride(row: Row) {
        try {
            await updateItem({
                id: row.id,
                body: { vipPercent: null },
            }).unwrap();
            setOverrideDrafts(prev => {
                const next = { ...prev };
                delete next[row.id];
                return next;
            });
            toast.success(t("toastOverrideCleared"), row.name);
        } catch (err) {
            toast.fromUnknown(err, t("toastOverrideError"));
        }
    }

    const columns: DataTableColumn<Row>[] = [
        {
            id: "name",
            header: t("colProduct"),
            cell: row => (
                <div>
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="text-[12px] text-slate-gray">
                        {row.categoryName}
                    </p>
                </div>
            ),
        },
        {
            id: "price",
            header: t("colPrice"),
            cell: row => formatEtb(Number(row.price)),
        },
        {
            id: "override",
            header: t("colOverride"),
            cell: row => (
                <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-9 w-24"
                    placeholder={t("inheritPlaceholder")}
                    value={row.overrideDraft}
                    onChange={e =>
                        setOverrideDrafts(prev => ({
                            ...prev,
                            [row.id]: e.target.value,
                        }))
                    }
                />
            ),
        },
        {
            id: "effective",
            header: t("colEffective"),
            cell: row => (
                <span className="tabular-nums">
                    {Number(row.effectiveVipPercent).toFixed(0)}%
                </span>
            ),
        },
        {
            id: "actions",
            header: "",
            cell: row => (
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingItem}
                        onClick={() => void onSaveOverride(row)}
                    >
                        <Save className="size-3.5" />
                        {t("save")}
                    </Button>
                    {row.vipPercent != null ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={savingItem}
                            onClick={() => void onClearOverride(row)}
                        >
                            {t("clearOverride")}
                        </Button>
                    ) : null}
                </div>
            ),
        },
    ];

    if (isError) {
        return (
            <p className="rounded-[12px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
                {t("loadError")}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <PageHeader
                eyebrow="Menu"
                title={t("title")}
                description={t("description")}
            />

            <div className="rounded-[16px] border border-hairline bg-card p-4">
                <h2 className="text-[15px] font-semibold">
                    {t("generalTitle")}
                </h2>
                <p className="mt-1 text-[12px] text-slate-gray">
                    {t("generalHint")}
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-[12px] text-slate-gray">
                            {t("defaultPercent")}
                        </label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-10 w-32"
                            value={houseDefault}
                            onChange={e => setDefaultDraft(e.target.value)}
                        />
                    </div>
                    <Button
                        type="button"
                        disabled={savingDefault || isLoading}
                        onClick={() => void onSaveDefault()}
                    >
                        <Save className="size-4" />
                        {t("saveDefault")}
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                rowKey={row => row.id}
                empty={isLoading ? t("loading") : t("empty")}
                searchPlaceholder={t("searchPlaceholder")}
                searchText={row => `${row.name} ${row.categoryName}`}
                showColumnToggle={false}
            />
        </div>
    );
}

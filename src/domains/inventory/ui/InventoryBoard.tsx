"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/context/hooks";
import {
    useCreateInventoryIngredientMutation,
    useCreateMainWarehouseMutation,
    useDeleteInventoryIngredientMutation,
    useGetInventoryNetworkStatusQuery,
    useListInventoryBalancesQuery,
    useListInventoryCountsQuery,
    useListInventoryIngredientsQuery,
    useListInventoryLedgerQuery,
    useListInventoryLocationsQuery,
    useListInventoryUnitsQuery,
    useListInventoryCategoriesQuery,
    usePostInventoryCountMutation,
    useReceiveInventoryStockMutation,
    useStartInventoryCountMutation,
    useUpdateInventoryCountLinesMutation,
    useUpdateInventoryIngredientMutation,
    useUpdateInventoryLocationMutation,
    useGetInventoryCountQuery,
    useWasteInventoryStockMutation,
    useListYieldTestsQuery,
    usePostYieldTestMutation,
    useUpdateYieldTestMutation,
    useDeleteYieldTestMutation,
    useListSupplyRequestsQuery,
    type InventoryIngredient,
    type InventoryItemKind,
    type InventoryLocation,
    type InventoryYieldTest,
} from "@/context/services/inventoryApi";
import { usePathname, useRouter } from "@/i18n/navigation";

const LEDGER_FILTER_OPTIONS = [
    { value: "PRODUCTION", group: true },
    { value: "TRANSFERS", group: true },
    { value: "PURCHASES", group: true },
    { value: "RECEIVE" },
    { value: "OPENING" },
    { value: "WASTE" },
    { value: "YIELD_TRIM" },
    { value: "SALE_DEPLETE" },
    { value: "COUNT_ADJUST" },
    { value: "PRODUCE_CONSUME" },
    { value: "PRODUCE_OUTPUT" },
    { value: "TRANSFER_OUT" },
    { value: "TRANSFER_IN" },
    { value: "TRANSFER_RETURN" },
    { value: "TRANSFER_SHORTAGE" },
    { value: "REVERSAL" },
] as const;
import { selectCurrentStaff } from "@/domains/ordering/application/selectors";
import InventoryProductionPanel from "@/domains/inventory/ui/InventoryProductionPanel";
import InventoryMaterialsPanel from "@/domains/inventory/ui/InventoryMaterialsPanel";
import {
    MySupplyRequestsPanel,
    PendingSupplyPanel,
    RequestSupplyPanel,
} from "@/domains/inventory/ui/InventorySupplyPanels";
import {
    IncomingTransfersPanel,
    OutgoingTransfersPanel,
    SendTransferPanel,
} from "@/domains/inventory/ui/InventoryTransferPanels";
import {
    InventoryNiceSelect,
    PrimaryActionButton,
    parsePositiveQty,
} from "@/domains/inventory/ui/InventoryFormControls";
import {
    ItemImagePicker,
    ItemThumbnail,
} from "@/domains/inventory/ui/ItemImagePicker";
import { CategoryManagerModal } from "@/domains/inventory/ui/CategoryManagerModal";
import { UnitManagerModal } from "@/domains/inventory/ui/UnitManagerModal";
import { VendorManagerSheet } from "@/domains/inventory/ui/VendorManagerSheet";
import { DriverManagementModal } from "@/domains/inventory/ui/DriverManagementModal";
import { InventoryCategoriesPanel } from "@/domains/inventory/ui/InventoryCategoriesPanel";
import { InventoryUnitsPanel } from "@/domains/inventory/ui/InventoryUnitsPanel";
import { InventoryVendorsPanel } from "@/domains/inventory/ui/InventoryVendorsPanel";
import { InventoryDriversPanel } from "@/domains/inventory/ui/InventoryDriversPanel";
import { ReceiveStockSheet } from "@/domains/inventory/ui/ReceiveStockSheet";
import { ReceiveHistoryView } from "@/domains/inventory/ui/ReceiveHistoryView";
import { UnitPicker } from "@/domains/inventory/ui/UnitPicker";
import type { InventoryPreset } from "@/domains/inventory/application/inventoryPresets";
import { formatEtb, formatQty } from "@/lib/money";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    Boxes,
    ChefHat,
    ClipboardCheck,
    Loader2,
    Pencil,
    Ruler,
    Store,
    Tag,
    Trash2,
    Truck,
    X,
} from "lucide-react";

type ConfirmDialogState = {
    title: string;
    body: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void | Promise<void>;
};

type Tab =
    | "stock"
    | "ingredients"
    | "materials"
    | "ledger"
    | "categories"
    | "units"
    | "vendors"
    | "drivers"
    | "receive"
    | "waste"
    | "yield"
    | "counts"
    | "send"
    | "incoming"
    | "outgoing"
    | "produce"
    | "request"
    | "pending-supply"
    | "my-requests";

type InventoryCategory =
    | "stock_items"
    | "branch_supply"
    | "receiving_audit"
    | "central_prep";

interface CategoryMeta {
    id: InventoryCategory;
    label: string;
    hint: string;
    icon: typeof Boxes;
    tabs: Tab[];
}

export default function InventoryBoard({
    initialTab,
}: { initialTab?: Tab } = {}) {
    const t = useTranslations("inventory");
    const router = useRouter();
    const pathname = usePathname();
    const staff = useAppSelector(selectCurrentStaff);
    const inventoryBasePath = useMemo(() => {
        const cleaned = pathname.replace(/\/$/, "");
        const invIdx = cleaned.split("/").lastIndexOf("inventory");
        if (invIdx >= 0) {
            return (
                cleaned
                    .split("/")
                    .slice(0, invIdx + 1)
                    .join("/") || "/owner/inventory"
            );
        }
        if (cleaned.includes("/manager/")) return "/manager/inventory";
        if (cleaned.includes("/store/")) return "/store/inventory";
        return "/owner/inventory";
    }, [pathname]);
    const [tab, setTab] = useState<Tab>(initialTab || "stock");

    useEffect(() => {
        if (initialTab) {
            setTab(initialTab);
        }
    }, [initialTab]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [vendorModalOpen, setVendorModalOpen] = useState(false);
    const [driverModalOpen, setDriverModalOpen] = useState(false);
    const [ledgerType, setLedgerType] = useState("");
    const [activeCountId, setActiveCountId] = useState<string | null>(null);
    const [locationId, setLocationId] = useState("");
    const [editingLocation, setEditingLocation] =
        useState<InventoryLocation | null>(null);
    const [editName, setEditName] = useState("");
    const [editCode, setEditCode] = useState("");
    const [editingIngredient, setEditingIngredient] =
        useState<InventoryIngredient | null>(null);
    const [editIngForm, setEditIngForm] = useState({
        name: "",
        unit: "kg",
        itemKind: "RAW" as InventoryItemKind,
        unitCost: "",
        parLevel: "",
        imageUrl: "",
        categoryId: "",
    });
    const [confirmDialog, setConfirmDialog] =
        useState<ConfirmDialogState | null>(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [receiveTried, setReceiveTried] = useState(false);
    const [wasteTried, setWasteTried] = useState(false);

    function ledgerTypeLabel(type: string) {
        const key = `ledgerTypes.${type}`;
        return t.has(key) ? t(key) : type;
    }

    function ledgerFilterLabel(value: string) {
        const groupKey = `ledgerGroups.${value}`;
        if (t.has(groupKey)) return t(groupKey);
        return ledgerTypeLabel(value);
    }

    const { data: unitsRes } = useListInventoryUnitsQuery();
    const unitOptions = unitsRes?.data ?? [];
    const { data: categoriesRes } = useListInventoryCategoriesQuery();
    const dbCategories = categoriesRes?.data ?? [];
    const { data: networkRes } = useGetInventoryNetworkStatusQuery();
    const { data: locationsRes } = useListInventoryLocationsQuery();
    const network = networkRes?.data;
    const locations = locationsRes?.data ?? [];
    const isNetwork = network?.mode === "NETWORK";
    const canOperateCentral =
        network?.canOperateCentral ??
        (staff?.role === "owner" || staff?.role === "store_manager");
    const canManageLocations = network?.canManageLocations ?? canOperateCentral;
    const canEnableMain = network?.canEnableMain ?? canOperateCentral;
    const isBranchScoped = !canOperateCentral;
    const mainLocation =
        locations.find(l => l.type === "MAIN_WAREHOUSE") ??
        network?.mainLocation ??
        null;
    const branchStores = locations.filter(l => l.type === "BRANCH_STORE");
    const myBranchStore = isBranchScoped ? (branchStores[0] ?? null) : null;
    const selectedLocation = locations.find(l => l.id === locationId);
    const stockTargetName = selectedLocation
        ? selectedLocation.type === "MAIN_WAREHOUSE"
            ? `${selectedLocation.name} (${t("locationMain")})`
            : selectedLocation.branch?.name
              ? `${selectedLocation.name} · ${selectedLocation.branch.name}`
              : selectedLocation.name
        : myBranchStore
          ? myBranchStore.branch?.name
              ? `${myBranchStore.name} · ${myBranchStore.branch.name}`
              : myBranchStore.name
          : t("stockTargetDefaultBranch");

    function selectStockLocation(nextId: string) {
        setLocationId(nextId);
        setPage(1);
    }

    useEffect(() => {
        if (
            isBranchScoped &&
            myBranchStore &&
            locationId !== myBranchStore.id
        ) {
            setLocationId(myBranchStore.id);
        } else if (
            canOperateCentral &&
            mainLocation &&
            (!locationId || locationId === "")
        ) {
            setLocationId(mainLocation.id);
        }
    }, [
        isBranchScoped,
        myBranchStore,
        canOperateCentral,
        mainLocation,
        locationId,
    ]);

    const tabs: { id: Tab; label: string; icon?: any; iconColor?: string }[] =
        useMemo(() => {
            const base: {
                id: Tab;
                label: string;
                icon?: any;
                iconColor?: string;
            }[] = [
                { id: "stock", label: t("tabs.stock") },
                { id: "ingredients", label: t("tabs.ingredients") },
                {
                    id: "materials",
                    label: "Materials",
                    icon: Boxes,
                    iconColor: "text-amber-600 dark:text-amber-400",
                },
                { id: "ledger", label: t("tabs.ledger") },
                {
                    id: "categories",
                    label: t("tabs.categories"),
                    icon: Tag,
                    iconColor: "text-emerald-600 dark:text-emerald-400",
                },
                {
                    id: "units",
                    label: t("tabs.units"),
                    icon: Ruler,
                    iconColor: "text-sky-600 dark:text-sky-400",
                },
                {
                    id: "vendors",
                    label: t("tabs.vendors"),
                    icon: Store,
                    iconColor: "text-emerald-600 dark:text-emerald-400",
                },
                ...(canOperateCentral
                    ? [
                          {
                              id: "drivers" as Tab,
                              label: t("tabs.drivers"),
                              icon: Truck,
                              iconColor: "text-amber-600 dark:text-amber-400",
                          },
                      ]
                    : []),
                { id: "receive", label: t("tabs.receive") },
                { id: "waste", label: t("tabs.waste") },
                { id: "yield", label: t("tabs.yield") },
                { id: "counts", label: t("tabs.counts") },
            ];
            if (!isNetwork) return base;
            if (canOperateCentral) {
                return [
                    ...base,
                    { id: "produce", label: t("tabs.produce") },
                    { id: "send", label: t("tabs.send") },
                    { id: "request", label: t("tabs.request") },
                    { id: "pending-supply", label: t("tabs.pendingSupply") },
                    { id: "my-requests", label: t("tabs.myRequests") },
                    { id: "outgoing", label: t("tabs.outgoing") },
                ];
            }
            return [
                ...base,
                { id: "produce", label: t("tabs.produce") },
                { id: "request", label: t("tabs.request") },
                { id: "my-requests", label: t("tabs.myRequests") },
                { id: "incoming", label: t("tabs.incoming") },
            ];
        }, [t, isNetwork, canOperateCentral]);

    const categories: CategoryMeta[] = useMemo(() => {
        const branchSupplyTabs: Tab[] = canOperateCentral
            ? ["pending-supply", "send", "outgoing"]
            : ["request", "my-requests", "incoming"];

        const centralPrepTabs: Tab[] = ["produce", "yield"];

        const allCats: CategoryMeta[] = [
            {
                id: "stock_items",
                label: t("categories.stockItems"),
                hint: t("categoryHints.stockItems"),
                icon: Boxes,
                tabs: [
                    "stock",
                    "ingredients",
                    "materials",
                    "ledger",
                    "categories",
                    "units",
                    "vendors",
                    ...(canOperateCentral ? (["drivers"] as Tab[]) : []),
                ],
            },
            {
                id: "branch_supply",
                label: t("categories.branchSupply"),
                hint: t("categoryHints.branchSupply"),
                icon: Truck,
                tabs: isNetwork ? branchSupplyTabs : [],
            },
            {
                id: "receiving_audit",
                label: t("categories.receivingAudit"),
                hint: t("categoryHints.receivingAudit"),
                icon: ClipboardCheck,
                tabs: ["receive", "counts", "waste"],
            },
            {
                id: "central_prep",
                label: t("categories.centralPrep"),
                hint: t("categoryHints.centralPrep"),
                icon: ChefHat,
                tabs: centralPrepTabs,
            },
        ];

        return allCats.filter(cat => cat.tabs.length > 0);
    }, [canOperateCentral, isNetwork, t]);

    const routeCategory = useMemo<InventoryCategory>(() => {
        if (pathname.includes("/inventory/materials")) return "stock_items";
        if (pathname.includes("/inventory/transfers")) return "branch_supply";
        if (pathname.includes("/inventory/receiving")) return "receiving_audit";
        if (pathname.includes("/inventory/prep")) return "central_prep";
        return "stock_items";
    }, [pathname]);

    const activeCategory = useMemo<InventoryCategory>(() => {
        const found = categories.find(cat => cat.tabs.includes(tab));
        return found ? found.id : routeCategory;
    }, [categories, tab, routeCategory]);

    useEffect(() => {
        const targetCategory = categories.find(c => c.id === routeCategory);
        if (targetCategory && !targetCategory.tabs.includes(tab)) {
            setTab(targetCategory.tabs[0]);
            setPage(1);
            setActiveCountId(null);
        }
    }, [routeCategory, categories]);

    const currentCategoryTabs = useMemo(() => {
        const current = categories.find(c => c.id === activeCategory);
        if (!current) return [];
        return current.tabs.map(tabId => {
            const found = tabs.find(item => item.id === tabId);
            return {
                id: tabId,
                label: found ? found.label : tabId,
                icon: found?.icon,
                iconColor: found?.iconColor,
            };
        });
    }, [categories, activeCategory, tabs]);

    function selectCategory(catId: InventoryCategory) {
        const targetCategory = categories.find(c => c.id === catId);
        if (!targetCategory || targetCategory.tabs.length === 0) return;

        let targetSlug = "";
        if (catId === "branch_supply") targetSlug = "/transfers";
        else if (catId === "receiving_audit") targetSlug = "/receiving";
        else if (catId === "central_prep") targetSlug = "/prep";

        const targetPath = `${inventoryBasePath}${targetSlug}`;
        if (pathname !== targetPath) {
            router.push(targetPath);
        } else if (!targetCategory.tabs.includes(tab)) {
            setTab(targetCategory.tabs[0]);
            setPage(1);
            setActiveCountId(null);
        }
    }

    useEffect(() => {
        if (!tabs.some(item => item.id === tab)) {
            setTab("stock");
        }
    }, [tabs, tab]);

    const listParams = useMemo(
        () => ({
            page,
            limit: 25,
            q: q.trim() || undefined,
            ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
            ...(tab === "stock" && lowStockOnly ? { lowStock: "true" } : {}),
            ...(tab === "ledger" && ledgerType ? { type: ledgerType } : {}),
            ...(locationId ? { locationId } : {}),
        }),
        [
            page,
            q,
            tab,
            lowStockOnly,
            ledgerType,
            locationId,
            selectedCategoryId,
        ],
    );

    const balances = useListInventoryBalancesQuery(listParams, {
        skip: tab !== "stock",
    });
    const tabCounts = useListInventoryBalancesQuery({
        page: 1,
        limit: 1,
        ...(locationId ? { locationId } : {}),
    });
    const ingredientCount = useListInventoryIngredientsQuery({
        page: 1,
        limit: 1,
    });
    const ingredients = useListInventoryIngredientsQuery(listParams, {
        skip:
            tab !== "ingredients" &&
            tab !== "receive" &&
            tab !== "waste" &&
            tab !== "yield",
    });
    const { data: yieldTestsRes, isLoading: yieldTestsLoading } =
        useListYieldTestsQuery(
            {
                page: 1,
                limit: 50,
                ...(locationId ? { locationId } : {}),
            },
            { skip: tab !== "yield" },
        );
    const ledger = useListInventoryLedgerQuery(listParams, {
        skip: tab !== "ledger",
    });
    const ledgerCount = useListInventoryLedgerQuery({
        page: 1,
        limit: 1,
        ...(locationId ? { locationId } : {}),
    });
    const counts = useListInventoryCountsQuery(
        { page, limit: 25 },
        { skip: tab !== "counts" },
    );
    const countsMeta = useListInventoryCountsQuery({ page: 1, limit: 1 });
    const countDetail = useGetInventoryCountQuery(activeCountId ?? "", {
        skip: !activeCountId,
    });
    const pendingSupply = useListSupplyRequestsQuery(
        { page: 1, limit: 1, direction: "pending" },
        { skip: !isNetwork || !canOperateCentral },
    );
    const pendingSupplyCount = pendingSupply.data?.meta?.total ?? 0;

    function getTabBadge(tabId: Tab): number | undefined {
        if (tabId === "stock") return tabCounts.data?.summary?.skuCount;
        if (tabId === "ingredients") return ingredientCount.data?.meta?.total;
        if (tabId === "ledger") return ledgerCount.data?.meta?.total;
        if (tabId === "counts") return countsMeta.data?.meta?.total;
        if (tabId === "pending-supply") {
            return pendingSupplyCount > 0 ? pendingSupplyCount : undefined;
        }
        return undefined;
    }

    const [createIngredient, creating] = useCreateInventoryIngredientMutation();
    const [updateIngredient, updatingIngredient] =
        useUpdateInventoryIngredientMutation();
    const [deleteIngredient, deletingIngredient] =
        useDeleteInventoryIngredientMutation();
    const [createMainWarehouse, enablingMain] =
        useCreateMainWarehouseMutation();
    const [updateLocation, updatingLocation] =
        useUpdateInventoryLocationMutation();
    const [receiveStock, receiving] = useReceiveInventoryStockMutation();
    const [wasteStock, wasting] = useWasteInventoryStockMutation();
    const [postYieldTest, yielding] = usePostYieldTestMutation();
    const [updateYieldTest, updatingYield] = useUpdateYieldTestMutation();
    const [deleteYieldTest, deletingYield] = useDeleteYieldTestMutation();
    const [editingYieldId, setEditingYieldId] = useState<string | null>(null);
    const [startCount, starting] = useStartInventoryCountMutation();
    const [updateLines, savingLines] = useUpdateInventoryCountLinesMutation();
    const [postCount, posting] = usePostInventoryCountMutation();

    const [ingForm, setIngForm] = useState({
        name: "",
        unit: "kg",
        itemKind: "RAW" as InventoryItemKind,
        unitCost: "",
        parLevel: "",
        initialQty: "",
        imageUrl: "",
        categoryId: "",
    });
    const [receiveForm, setReceiveForm] = useState({
        ingredientId: "",
        quantity: "",
        unitCost: "",
        supplierNote: "",
        invoiceRef: "",
    });
    const [wasteForm, setWasteForm] = useState({
        ingredientId: "",
        quantity: "",
        unit: "",
        note: "",
    });
    const [yieldTried, setYieldTried] = useState(false);
    const [yieldForm, setYieldForm] = useState({
        ingredientId: "",
        purchasedQuantity: "",
        usableQuantity: "",
        unit: "",
        writeOffTrim: true,
        note: "",
    });
    const [countEdits, setCountEdits] = useState<Record<string, string>>({});
    const [countUnits, setCountUnits] = useState<Record<string, string>>({});
    const [receiveSheetOpen, setReceiveSheetOpen] = useState(false);

    function resetPageOnSearch(value: string) {
        setQ(value);
        setPage(1);
    }

    async function onCreateIngredient(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createIngredient({
                name: ingForm.name.trim(),
                unit: ingForm.unit.trim() || "kg",
                itemKind: ingForm.itemKind,
                unitCost: Number(ingForm.unitCost) || 0,
                parLevel: Number(ingForm.parLevel) || 0,
                initialQty: Number(ingForm.initialQty) || 0,
                imageUrl: ingForm.imageUrl
                    ? ingForm.imageUrl.trim()
                    : undefined,
                categoryId: ingForm.categoryId || undefined,
                ...(locationId ? { locationId } : {}),
            }).unwrap();
            toast.success(t("toastIngredientCreated"), ingForm.name.trim());
            setIngForm({
                name: "",
                unit: "kg",
                itemKind: "RAW",
                unitCost: "",
                parLevel: "",
                initialQty: "",
                imageUrl: "",
                categoryId: "",
            });
        } catch (err) {
            toast.fromUnknown(err, t("errCreateIngredient"));
        }
    }

    async function onEnableMainWarehouse() {
        try {
            const res = await createMainWarehouse({
                name: t("mainWarehouseDefaultName"),
                code: "MAIN",
            }).unwrap();
            if (res?.data?.id) {
                selectStockLocation(res.data.id);
            }
            toast.success(t("toastMainEnabled"));
        } catch (err) {
            toast.fromUnknown(err, t("errEnableMain"));
        }
    }

    function openEditIngredient(row: InventoryIngredient) {
        setEditingIngredient(row);
        setEditIngForm({
            name: row.name,
            unit: row.unit || "kg",
            itemKind: (row.itemKind as InventoryItemKind) || "RAW",
            unitCost: String(row.unitCost ?? ""),
            parLevel: String(row.parLevel ?? ""),
            imageUrl: row.imageUrl || "",
            categoryId: row.categoryId || "",
        });
    }

    async function onSaveIngredientEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingIngredient) return;
        try {
            await updateIngredient({
                id: editingIngredient.id,
                body: {
                    name: editIngForm.name.trim(),
                    unit: editIngForm.unit,
                    itemKind: editIngForm.itemKind,
                    unitCost: Number(editIngForm.unitCost) || 0,
                    parLevel: Number(editIngForm.parLevel) || 0,
                    imageUrl: editIngForm.imageUrl
                        ? editIngForm.imageUrl.trim()
                        : null,
                    categoryId: editIngForm.categoryId || null,
                },
            }).unwrap();
            toast.success(t("toastIngredientUpdated"));
            setEditingIngredient(null);
        } catch (err) {
            toast.fromUnknown(err, t("errUpdateIngredient"));
        }
    }

    function askDeleteIngredient(row: InventoryIngredient) {
        setConfirmDialog({
            title: t("deleteIngredientTitle"),
            body: t("deleteIngredientConfirm", { name: row.name }),
            confirmLabel: t("deleteIngredientAction"),
            danger: true,
            onConfirm: async () => {
                await deleteIngredient(row.id).unwrap();
                toast.success(t("toastIngredientDeleted"));
            },
        });
    }

    async function runConfirm() {
        if (!confirmDialog) return;
        setConfirmBusy(true);
        try {
            await confirmDialog.onConfirm();
            setConfirmDialog(null);
        } catch (err) {
            toast.fromUnknown(
                err,
                confirmDialog.danger
                    ? t("errConfirmAction")
                    : t("errConfirmAction"),
            );
        } finally {
            setConfirmBusy(false);
        }
    }

    function openEditLocation(loc: InventoryLocation) {
        setEditingLocation(loc);
        setEditName(loc.name);
        setEditCode(loc.code);
    }

    async function onSaveLocationEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLocation) return;
        try {
            await updateLocation({
                id: editingLocation.id,
                name: editName.trim(),
                code: editCode.trim() || undefined,
            }).unwrap();
            toast.success(t("toastStoreUpdated"));
            setEditingLocation(null);
        } catch (err) {
            toast.fromUnknown(err, t("errUpdateStore"));
        }
    }

    async function onReceive(e: React.FormEvent) {
        e.preventDefault();
        setReceiveTried(true);
        const qty = parsePositiveQty(receiveForm.quantity);
        if (!receiveForm.ingredientId) {
            toast.error(t("errPickIngredient"));
            return;
        }
        if (qty == null) {
            toast.error(t("errQtyRequired"));
            return;
        }
        try {
            await receiveStock({
                ingredientId: receiveForm.ingredientId,
                quantity: qty,
                ...(locationId ? { locationId } : {}),
                unitCost: receiveForm.unitCost
                    ? Number(receiveForm.unitCost)
                    : undefined,
                supplierNote: receiveForm.supplierNote || undefined,
                invoiceRef: receiveForm.invoiceRef || undefined,
            }).unwrap();
            toast.success(t("toastStockReceived"));
            setReceiveForm({
                ingredientId: "",
                quantity: "",
                unitCost: "",
                supplierNote: "",
                invoiceRef: "",
            });
            setReceiveTried(false);
        } catch (err) {
            toast.fromUnknown(err, t("errReceive"));
        }
    }

    async function onWaste(e: React.FormEvent) {
        e.preventDefault();
        setWasteTried(true);
        const qty = parsePositiveQty(wasteForm.quantity);
        if (!wasteForm.ingredientId) {
            toast.error(t("errPickIngredient"));
            return;
        }
        if (qty == null) {
            toast.error(t("errQtyRequired"));
            return;
        }
        try {
            await wasteStock({
                ingredientId: wasteForm.ingredientId,
                quantity: qty,
                ...(wasteForm.unit ? { unit: wasteForm.unit } : {}),
                note: wasteForm.note || undefined,
            }).unwrap();
            toast.success(t("toastWasteLogged"));
            setWasteForm({
                ingredientId: "",
                quantity: "",
                unit: "",
                note: "",
            });
            setWasteTried(false);
        } catch (err) {
            toast.fromUnknown(err, t("errWaste"));
        }
    }

    function resetYieldForm() {
        setYieldForm({
            ingredientId: "",
            purchasedQuantity: "",
            usableQuantity: "",
            unit: "",
            writeOffTrim: true,
            note: "",
        });
        setEditingYieldId(null);
        setYieldTried(false);
    }

    function beginEditYield(row: InventoryYieldTest) {
        setEditingYieldId(row.id);
        setYieldForm({
            ingredientId: row.ingredient.id,
            purchasedQuantity: String(row.purchasedQuantity),
            usableQuantity: String(row.usableQuantity),
            unit: row.unit ?? row.ingredient.unit,
            writeOffTrim: false,
            note: row.note ?? "",
        });
        setYieldTried(false);
    }

    function askDeleteYield(row: InventoryYieldTest) {
        setConfirmDialog({
            title: t("confirmDeleteYieldTitle"),
            body: t("confirmDeleteYieldBody", {
                name: row.ingredient.name,
                yield: Number(row.yieldPercent).toFixed(1),
            }),
            confirmLabel: t("confirmDeleteYieldAction"),
            danger: true,
            onConfirm: async () => {
                await deleteYieldTest(row.id).unwrap();
                toast.success(t("toastYieldDeleted"));
                if (editingYieldId === row.id) resetYieldForm();
            },
        });
    }

    function onYieldTest(e: React.FormEvent) {
        e.preventDefault();
        setYieldTried(true);
        const purchased = parsePositiveQty(yieldForm.purchasedQuantity);
        const usable = parsePositiveQty(yieldForm.usableQuantity);
        if (!yieldForm.ingredientId) {
            toast.error(t("errPickIngredient"));
            return;
        }
        if (purchased == null || usable == null) {
            toast.error(t("errQtyRequired"));
            return;
        }
        if (usable > purchased) {
            toast.error(t("errYieldUsableTooHigh"));
            return;
        }
        const yieldPct = (usable / purchased) * 100;
        const ingredientName =
            ingredientOptions.find(i => i.id === yieldForm.ingredientId)
                ?.name ?? "";

        setConfirmDialog({
            title: editingYieldId
                ? t("confirmUpdateYieldTitle")
                : t("confirmAddYieldTitle"),
            body: editingYieldId
                ? t("confirmUpdateYieldBody", {
                      name: ingredientName,
                      yield: yieldPct.toFixed(1),
                  })
                : t("confirmAddYieldBody", {
                      name: ingredientName,
                      yield: yieldPct.toFixed(1),
                      trim: formatQty(purchased - usable),
                  }),
            confirmLabel: editingYieldId
                ? t("confirmUpdateYieldAction")
                : t("confirmAddYieldAction"),
            onConfirm: async () => {
                if (editingYieldId) {
                    const res = await updateYieldTest({
                        id: editingYieldId,
                        body: {
                            purchasedQuantity: purchased,
                            usableQuantity: usable,
                            ...(yieldForm.unit ? { unit: yieldForm.unit } : {}),
                            note: yieldForm.note || null,
                        },
                    }).unwrap();
                    toast.success(
                        t("toastYieldUpdated"),
                        t("toastYieldDetail", {
                            yield: res.data.yieldPercent.toFixed(1),
                            epCost: formatEtb(res.data.epUnitCost),
                            trim: formatQty(res.data.trimQuantity),
                        }),
                    );
                } else {
                    const res = await postYieldTest({
                        ingredientId: yieldForm.ingredientId,
                        purchasedQuantity: purchased,
                        usableQuantity: usable,
                        ...(yieldForm.unit ? { unit: yieldForm.unit } : {}),
                        ...(locationId ? { locationId } : {}),
                        writeOffTrim: yieldForm.writeOffTrim,
                        note: yieldForm.note || undefined,
                    }).unwrap();
                    toast.success(
                        t("toastYieldPosted"),
                        t("toastYieldDetail", {
                            yield: res.data.yieldPercent.toFixed(1),
                            epCost: formatEtb(res.data.epUnitCost),
                            trim: formatQty(res.data.trimQuantity),
                        }),
                    );
                }
                resetYieldForm();
            },
        });
    }

    async function onStartCount() {
        try {
            const res = await startCount({}).unwrap();
            setActiveCountId(res.data.id);
            toast.success(t("toastCountStarted"));
        } catch (err) {
            toast.fromUnknown(err, t("errStartCount"));
        }
    }

    async function onSaveCountLines() {
        if (!activeCountId || !countDetail.data?.data) return;
        const lines = countDetail.data.data.lines
            .map(line => {
                const raw =
                    countEdits[line.ingredientId] ??
                    (line.countedQty != null ? String(line.countedQty) : "");
                if (raw === "") return null;
                const unit =
                    countUnits[line.ingredientId] ??
                    line.countedUnit ??
                    line.unit;
                return {
                    ingredientId: line.ingredientId,
                    countedQty: Number(raw),
                    ...(unit && unit !== line.unit ? { unit } : {}),
                };
            })
            .filter(Boolean) as Array<{
            ingredientId: string;
            countedQty: number;
            unit?: string;
        }>;
        try {
            await updateLines({ id: activeCountId, lines }).unwrap();
            toast.success(t("toastCountLinesSaved"));
        } catch (err) {
            toast.fromUnknown(err, t("errSaveLines"));
        }
    }

    async function onPostCount() {
        if (!activeCountId) return;
        try {
            await onSaveCountLines();
            await postCount(activeCountId).unwrap();
            toast.success(t("toastCountPosted"));
            setActiveCountId(null);
            setCountEdits({});
            setCountUnits({});
        } catch (err) {
            toast.fromUnknown(err, t("errPostCount"));
        }
    }

    const meta =
        tab === "stock"
            ? balances.data?.meta
            : tab === "ingredients"
              ? ingredients.data?.meta
              : tab === "ledger"
                ? ledger.data?.meta
                : counts.data?.meta;

    const ingredientOptions = ingredients.data?.data ?? [];

    const selectedReceive = ingredientOptions.find(
        i => i.id === receiveForm.ingredientId,
    );
    const receiveQty = Number(receiveForm.quantity) || 0;
    const receiveUnitCost =
        receiveForm.unitCost !== ""
            ? Number(receiveForm.unitCost) || 0
            : (selectedReceive?.unitCost ?? 0);
    const receiveTotal = receiveQty * receiveUnitCost;

    const selectedWaste = ingredientOptions.find(
        i => i.id === wasteForm.ingredientId,
    );
    const wasteQty = Number(wasteForm.quantity) || 0;
    const wasteTotal = wasteQty * (selectedWaste?.unitCost ?? 0);
    const selectedYield = ingredientOptions.find(
        i => i.id === yieldForm.ingredientId,
    );
    const yieldPurchased = Number(yieldForm.purchasedQuantity) || 0;
    const yieldUsable = Number(yieldForm.usableQuantity) || 0;
    const yieldTrim = Math.max(0, yieldPurchased - yieldUsable);
    const yieldPctPreview =
        yieldPurchased > 0 && yieldUsable > 0
            ? (yieldUsable / yieldPurchased) * 100
            : null;
    const yieldEpCostPreview =
        yieldPctPreview != null && yieldPctPreview > 0 && selectedYield != null
            ? selectedYield.unitCost / (yieldPctPreview / 100)
            : null;

    const openingQty = Number(ingForm.initialQty) || 0;
    const openingCost = Number(ingForm.unitCost) || 0;
    const openingValue = openingQty * openingCost;

    return (
        <div className="space-y-4">
            {network ? (
                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-hairline bg-card/40 p-2">
                    {isBranchScoped && myBranchStore ? (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-card px-3 py-1.5 text-[12px] shadow-2xs">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-foreground">
                                {myBranchStore.branch?.name ??
                                    myBranchStore.name}
                            </span>
                            <span className="text-[11px] text-slate-gray">
                                {t("storeCardBranchBadge")}
                            </span>
                        </div>
                    ) : null}

                    {!isBranchScoped ? (
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                            {isNetwork && mainLocation ? (
                                <div
                                    className={cn(
                                        "group inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-all",
                                        locationId === mainLocation.id
                                            ? "border border-hairline bg-card text-foreground font-semibold shadow-xs ring-1 ring-black/5 dark:ring-white/10"
                                            : "text-slate-gray hover:bg-card/60 hover:text-foreground",
                                    )}
                                >
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5"
                                        onClick={() =>
                                            selectStockLocation(mainLocation.id)
                                        }
                                    >
                                        <span>{mainLocation.name}</span>
                                        <span
                                            className={cn(
                                                "rounded px-1.5 py-0.2 text-[10px] font-medium leading-tight",
                                                locationId === mainLocation.id
                                                    ? "bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                                    : "bg-secondary text-slate-gray",
                                            )}
                                        >
                                            {t("storeCardMainBadge")}
                                        </span>
                                    </button>
                                    {canManageLocations ? (
                                        <button
                                            type="button"
                                            aria-label={t("editStore")}
                                            className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-gray hover:text-foreground"
                                            onClick={() =>
                                                openEditLocation(mainLocation)
                                            }
                                        >
                                            <Pencil className="size-3" />
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {!isNetwork && canEnableMain ? (
                        <div className="flex items-center gap-2 rounded-lg border border-hairline bg-card/60 px-2.5 py-1 text-[12px]">
                            <span className="text-[11px] font-medium text-slate-gray">
                                {t("mainInventoryLabel")}
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isNetwork}
                                aria-label={t("mainInventoryLabel")}
                                disabled={enablingMain.isLoading}
                                onClick={() => void onEnableMainWarehouse()}
                                className={cn(
                                    "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60",
                                    "bg-slate-300 dark:bg-slate-700",
                                )}
                            >
                                {enablingMain.isLoading ? (
                                    <Loader2 className="absolute inset-0 m-auto size-3 animate-spin text-white" />
                                ) : (
                                    <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform" />
                                )}
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {editingLocation ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <form
                        onSubmit={onSaveLocationEdit}
                        className="w-full max-w-md space-y-3 rounded-2xl border border-hairline bg-card p-5 shadow-xl"
                    >
                        <h3 className="text-[15px] font-semibold">
                            {t("editStoreTitle")}
                        </h3>
                        <p className="text-[12px] text-slate-gray">
                            {t("editStoreHint")}
                        </p>
                        <label className="block space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldStoreName")}
                            </span>
                            <input
                                required
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px]"
                            />
                        </label>
                        <label className="block space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldStoreCode")}
                            </span>
                            <input
                                value={editCode}
                                onChange={e => setEditCode(e.target.value)}
                                className="h-10 w-full rounded-xl border border-hairline bg-background px-3 text-[13px] uppercase"
                            />
                        </label>
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                className="h-10 rounded-xl border border-hairline px-3 text-[13px]"
                                onClick={() => setEditingLocation(null)}
                            >
                                {t("cancelEditStore")}
                            </button>
                            <button
                                type="submit"
                                disabled={updatingLocation.isLoading}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 text-[13px] font-semibold text-white disabled:opacity-60"
                            >
                                {updatingLocation.isLoading ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : null}
                                {t("saveStore")}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {editingIngredient ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <form
                        onSubmit={onSaveIngredientEdit}
                        className="w-full max-w-md space-y-3 rounded-2xl border border-hairline bg-card p-5 shadow-xl"
                    >
                        <h3 className="text-[15px] font-semibold">
                            {t("editIngredientTitle")}
                        </h3>
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldImage")}
                            </span>
                            <ItemImagePicker
                                value={editIngForm.imageUrl}
                                onChange={url =>
                                    setEditIngForm(s => ({
                                        ...s,
                                        imageUrl: url,
                                    }))
                                }
                                itemName={editIngForm.name}
                                onSelectPreset={(preset: InventoryPreset) => {
                                    setEditIngForm(s => ({
                                        ...s,
                                        imageUrl: preset.imageUrl,
                                    }));
                                }}
                            />
                        </div>
                        <Field
                            label={t("fieldName")}
                            value={editIngForm.name}
                            onChange={v =>
                                setEditIngForm(s => ({ ...s, name: v }))
                            }
                            required
                        />
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldUnit")}
                            </span>
                            <InventoryNiceSelect
                                value={editIngForm.unit}
                                placeholder={t("fieldUnit")}
                                options={
                                    unitOptions.length === 0
                                        ? [{ value: "kg", label: "kg" }]
                                        : unitOptions.map(u => ({
                                              value: u.code,
                                              label: `${u.name} (${u.code})`,
                                          }))
                                }
                                onChange={v =>
                                    setEditIngForm(s => ({ ...s, unit: v }))
                                }
                            />
                        </div>
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldItemKind")}
                            </span>
                            <InventoryNiceSelect
                                value={editIngForm.itemKind}
                                placeholder={t("fieldItemKind")}
                                options={[
                                    { value: "RAW", label: t("itemKindRaw") },
                                    {
                                        value: "PRODUCED",
                                        label: t("itemKindProduced"),
                                    },
                                    {
                                        value: "FINISHED",
                                        label: t("itemKindFinished"),
                                    },
                                ]}
                                onChange={v =>
                                    setEditIngForm(s => ({
                                        ...s,
                                        itemKind: v as InventoryItemKind,
                                    }))
                                }
                            />
                        </div>
                        <Field
                            label={t("fieldUnitCost")}
                            value={editIngForm.unitCost}
                            onChange={v =>
                                setEditIngForm(s => ({ ...s, unitCost: v }))
                            }
                            type="number"
                        />
                        <Field
                            label={t("fieldParLevel")}
                            value={editIngForm.parLevel}
                            onChange={v =>
                                setEditIngForm(s => ({ ...s, parLevel: v }))
                            }
                            type="number"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                className="h-10 rounded-xl border border-hairline px-3 text-[13px]"
                                onClick={() => setEditingIngredient(null)}
                            >
                                {t("cancelEditIngredient")}
                            </button>
                            <button
                                type="submit"
                                disabled={updatingIngredient.isLoading}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 text-[13px] font-semibold text-white disabled:opacity-60"
                            >
                                {updatingIngredient.isLoading ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : null}
                                {t("saveIngredient")}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {confirmDialog ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-hairline bg-card p-5 shadow-xl">
                        <div>
                            <h3 className="text-[15px] font-semibold text-foreground">
                                {confirmDialog.title}
                            </h3>
                            <p className="mt-2 text-[13px] leading-relaxed text-slate-gray">
                                {confirmDialog.body}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={confirmBusy}
                                className="h-10 rounded-xl border border-hairline px-3.5 text-[13px]"
                                onClick={() => setConfirmDialog(null)}
                            >
                                {t("cancelConfirm")}
                            </button>
                            <button
                                type="button"
                                disabled={
                                    confirmBusy ||
                                    deletingIngredient.isLoading ||
                                    deletingYield.isLoading ||
                                    yielding.isLoading ||
                                    updatingYield.isLoading
                                }
                                onClick={() => void runConfirm()}
                                className={cn(
                                    "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold text-white disabled:opacity-60",
                                    confirmDialog.danger
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-emerald-600 hover:bg-emerald-700",
                                )}
                            >
                                {confirmBusy ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : null}
                                {confirmDialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Sub-Views Pill Bar (Displaying only the views for active category) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3 pt-1">
                {currentCategoryTabs.map(tabItem => {
                    const active = tab === tabItem.id;
                    const badge = getTabBadge(tabItem.id);

                    return (
                        <button
                            key={tabItem.id}
                            type="button"
                            onClick={() => {
                                setTab(tabItem.id);
                                setPage(1);
                                setActiveCountId(null);
                            }}
                            className={cn(
                                "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all border",
                                active
                                    ? "bg-foreground text-background shadow-xs font-semibold border-foreground"
                                    : "bg-card text-slate-gray border-hairline hover:bg-secondary hover:text-foreground",
                            )}
                        >
                            {tabItem.icon ? (
                                <tabItem.icon
                                    className={cn(
                                        "size-3.5 shrink-0",
                                        active
                                            ? "text-background"
                                            : tabItem.iconColor,
                                    )}
                                />
                            ) : null}
                            <span>{tabItem.label}</span>
                            {badge != null && Number(badge) > 0 ? (
                                <span
                                    className={cn(
                                        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                                        active
                                            ? "bg-background/20 text-background"
                                            : tabItem.id === "pending-supply"
                                              ? "bg-emerald-600 text-white"
                                              : "bg-secondary text-slate-gray",
                                    )}
                                >
                                    {badge}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {(tab === "stock" || tab === "ingredients" || tab === "ledger") && (
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={q}
                        onChange={e => resetPageOnSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="h-10 w-full max-w-xs rounded-xl border border-hairline bg-background px-3 text-[13px]"
                    />

                    {(tab === "stock" || tab === "ingredients") && (
                        <div className="flex items-center gap-2">
                            <div className="min-w-[14rem]">
                                <InventoryNiceSelect
                                    value={selectedCategoryId || "__all__"}
                                    placeholder={t("allCategories")}
                                    options={[
                                        {
                                            value: "__all__",
                                            label: t("allCategories"),
                                        },
                                        ...dbCategories.map(c => ({
                                            value: c.id,
                                            label: c.amharicName
                                                ? `${c.name} (${c.amharicName})`
                                                : c.name,
                                        })),
                                    ]}
                                    onChange={v => {
                                        setSelectedCategoryId(
                                            v === "__all__" ? "" : v,
                                        );
                                        setPage(1);
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setTab("categories")}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <Tag className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{t("tabs.categories")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("units")}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <Ruler className="size-3.5 text-sky-600 dark:text-sky-400" />
                                <span>{t("tabs.units")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("vendors")}
                                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                            >
                                <Store className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{t("tabs.vendors")}</span>
                            </button>
                            {canOperateCentral && (
                                <button
                                    type="button"
                                    onClick={() => setTab("drivers")}
                                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-card px-3 text-[13px] font-medium text-slate-gray hover:bg-secondary hover:text-foreground transition-colors"
                                >
                                    <Truck className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>{t("tabs.drivers")}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {tab === "stock" ? (
                        <label className="flex items-center gap-2 text-[13px]">
                            <input
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={e => {
                                    setLowStockOnly(e.target.checked);
                                    setPage(1);
                                }}
                            />
                            {t("lowStockOnly")}
                        </label>
                    ) : null}
                    {tab === "ledger" ? (
                        <div className="min-w-[12rem]">
                            <InventoryNiceSelect
                                value={ledgerType || "__all__"}
                                placeholder={t("allTypes")}
                                options={[
                                    { value: "__all__", label: t("allTypes") },
                                    ...LEDGER_FILTER_OPTIONS.map(opt => ({
                                        value: opt.value,
                                        label: ledgerFilterLabel(opt.value),
                                    })),
                                ]}
                                onChange={v => {
                                    setLedgerType(v === "__all__" ? "" : v);
                                    setPage(1);
                                }}
                            />
                        </div>
                    ) : null}
                </div>
            )}

            {tab === "stock" ? (
                <div className="overflow-hidden rounded-2xl border border-hairline">
                    {balances.isLoading ? (
                        <LoadingRow />
                    ) : (
                        <table className="w-full text-left text-[13px]">
                            <thead className="bg-surface-ivory text-slate-gray">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colIngredient")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colOnHand")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colPar")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colCost")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colValue")}
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        {t("colStatus")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(balances.data?.data ?? []).map(row => (
                                    <tr
                                        key={row.ingredientId}
                                        className="border-t border-hairline"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            <div className="flex items-center gap-3">
                                                <ItemThumbnail
                                                    src={row.imageUrl}
                                                    name={row.name}
                                                    className="size-9"
                                                />
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        {row.name}
                                                    </span>
                                                    {row.category ? (
                                                        <span className="block text-[11px] text-slate-gray">
                                                            {row.category.name}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {formatQty(row.onHandQty)}{" "}
                                            {row.unit}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">
                                            {formatQty(row.parLevel)} {row.unit}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-slate-gray">
                                            {formatEtb(row.unitCost)}
                                            <span className="text-[11px]">
                                                {" "}
                                                / {row.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium tabular-nums">
                                            {formatEtb(
                                                row.stockValue ??
                                                    row.onHandQty *
                                                        row.unitCost,
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.isLowStock ? (
                                                <span className="text-amber-600">
                                                    {t("statusLow")}
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600">
                                                    {t("statusOk")}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(balances.data?.data ?? []).length === 0 ? (
                                    <EmptyRow
                                        text={t("emptyStock")}
                                        colSpan={6}
                                    />
                                ) : null}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : null}

            {tab === "ingredients" ? (
                <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="overflow-hidden rounded-2xl border border-hairline">
                        {ingredients.isLoading ? (
                            <LoadingRow />
                        ) : (
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colName")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colUnit")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colOnHand")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colCost")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colValue")}
                                        </th>
                                        <th className="px-4 py-3 font-medium text-right">
                                            {t("colActions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ingredients.data?.data ?? []).map(row => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-3">
                                                    <ItemThumbnail
                                                        src={row.imageUrl}
                                                        name={row.name}
                                                        className="size-10"
                                                    />
                                                    <div>
                                                        <span className="font-semibold text-foreground">
                                                            {row.name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] text-slate-gray">
                                                                {row.itemKind}
                                                            </span>
                                                            {row.category ? (
                                                                <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-gray">
                                                                    {
                                                                        row
                                                                            .category
                                                                            .name
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.unit}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums">
                                                {formatQty(row.onHandQty)}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-slate-gray">
                                                <span>
                                                    {formatEtb(row.unitCost)}
                                                </span>
                                                {row.standardYieldPercent !=
                                                    null &&
                                                row.standardYieldPercent > 0 ? (
                                                    <span className="mt-0.5 block text-[10px] text-slate-gray">
                                                        {Number(
                                                            row.standardYieldPercent,
                                                        ).toFixed(0)}
                                                        % →{" "}
                                                        {formatEtb(
                                                            row.usableUnitCost ??
                                                                row.unitCost,
                                                        )}{" "}
                                                        EP
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 font-medium tabular-nums">
                                                {formatEtb(
                                                    row.stockValue ??
                                                        row.onHandQty *
                                                            row.unitCost,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        aria-label={t(
                                                            "editIngredient",
                                                        )}
                                                        className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                                                        onClick={() =>
                                                            openEditIngredient(
                                                                row,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={t(
                                                            "deleteIngredient",
                                                        )}
                                                        className="rounded-lg p-1.5 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                                        onClick={() =>
                                                            askDeleteIngredient(
                                                                row,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(ingredients.data?.data ?? []).length ===
                                    0 ? (
                                        <EmptyRow
                                            text={t("emptyIngredients")}
                                            colSpan={6}
                                        />
                                    ) : null}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <form
                        onSubmit={onCreateIngredient}
                        className="space-y-3 rounded-2xl border border-hairline p-4"
                    >
                        <h3 className="text-[14px] font-semibold">
                            {t("addIngredient")}
                        </h3>
                        {canOperateCentral && isNetwork ? (
                            <p className="rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-slate-gray">
                                {t("stockTargetHint", {
                                    name: stockTargetName,
                                })}
                            </p>
                        ) : null}
                        <div className="space-y-1 text-[12px]">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-gray">
                                    Category
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCategoryModalOpen(true)}
                                    className="text-[11px] text-emerald-600 hover:underline"
                                >
                                    + New Category
                                </button>
                            </div>
                            <InventoryNiceSelect
                                value={ingForm.categoryId || "__none__"}
                                placeholder="Select category..."
                                options={[
                                    {
                                        value: "__none__",
                                        label: "Select category...",
                                    },
                                    ...dbCategories.map(c => ({
                                        value: c.id,
                                        label: c.amharicName
                                            ? `${c.name} (${c.amharicName})`
                                            : c.name,
                                    })),
                                ]}
                                onChange={v =>
                                    setIngForm(s => ({
                                        ...s,
                                        categoryId: v === "__none__" ? "" : v,
                                    }))
                                }
                            />
                        </div>

                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldImage")}
                            </span>
                            <ItemImagePicker
                                value={ingForm.imageUrl}
                                onChange={url =>
                                    setIngForm(s => ({ ...s, imageUrl: url }))
                                }
                                itemName={ingForm.name}
                                onSelectPreset={(preset: InventoryPreset) => {
                                    const matchingDbCat = dbCategories.find(
                                        c => c.code === preset.category,
                                    );
                                    setIngForm(s => ({
                                        ...s,
                                        name: preset.name,
                                        unit: preset.unit,
                                        itemKind: preset.itemKind,
                                        imageUrl: preset.imageUrl,
                                        ...(matchingDbCat
                                            ? { categoryId: matchingDbCat.id }
                                            : {}),
                                    }));
                                }}
                            />
                        </div>
                        <Field
                            label={t("fieldName")}
                            value={ingForm.name}
                            onChange={v => setIngForm(s => ({ ...s, name: v }))}
                            required
                        />
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldUnit")}
                            </span>
                            <InventoryNiceSelect
                                value={ingForm.unit}
                                placeholder={t("fieldUnit")}
                                options={
                                    unitOptions.length === 0
                                        ? [{ value: "kg", label: "kg" }]
                                        : unitOptions.map(u => ({
                                              value: u.code,
                                              label: `${u.name} (${u.code})`,
                                          }))
                                }
                                onChange={v =>
                                    setIngForm(s => ({ ...s, unit: v }))
                                }
                            />
                            <span className="text-[11px] text-slate-gray">
                                {t("fieldUnitHint")}
                            </span>
                        </div>
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("fieldItemKind")}
                            </span>
                            <InventoryNiceSelect
                                value={ingForm.itemKind}
                                placeholder={t("fieldItemKind")}
                                options={[
                                    { value: "RAW", label: t("itemKindRaw") },
                                    {
                                        value: "PRODUCED",
                                        label: t("itemKindProduced"),
                                    },
                                    {
                                        value: "FINISHED",
                                        label: t("itemKindFinished"),
                                    },
                                ]}
                                onChange={v =>
                                    setIngForm(s => ({
                                        ...s,
                                        itemKind: v as InventoryItemKind,
                                    }))
                                }
                            />
                            <span className="text-[11px] text-slate-gray">
                                {t("fieldItemKindHint")}
                            </span>
                        </div>
                        <Field
                            label={t("fieldUnitCost")}
                            value={ingForm.unitCost}
                            onChange={v =>
                                setIngForm(s => ({ ...s, unitCost: v }))
                            }
                            type="number"
                        />
                        <Field
                            label={t("fieldParLevel")}
                            hint={t("fieldParHint")}
                            value={ingForm.parLevel}
                            onChange={v =>
                                setIngForm(s => ({ ...s, parLevel: v }))
                            }
                            type="number"
                        />
                        <Field
                            label={t("fieldInitialQty")}
                            hint={t("fieldInitialHint")}
                            value={ingForm.initialQty}
                            onChange={v =>
                                setIngForm(s => ({ ...s, initialQty: v }))
                            }
                            type="number"
                        />
                        {openingQty > 0 ? (
                            <div className="rounded-xl bg-secondary/60 px-3 py-2 text-[12px]">
                                <span className="text-slate-gray">
                                    {t("openingValue")}
                                </span>
                                <span className="ml-2 font-medium tabular-nums text-foreground">
                                    {formatEtb(openingValue)}
                                </span>
                            </div>
                        ) : null}
                        <button
                            type="submit"
                            disabled={creating.isLoading}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[13px] font-semibold text-white disabled:opacity-60"
                        >
                            {creating.isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t("create")}
                        </button>
                    </form>
                </div>
            ) : null}

            {tab === "receive" ? (
                <>
                    <ReceiveHistoryView
                        locationId={locationId}
                        stockTargetName={stockTargetName}
                        onOpenReceiveSheet={() => setReceiveSheetOpen(true)}
                    />
                    <ReceiveStockSheet
                        open={receiveSheetOpen}
                        onClose={() => setReceiveSheetOpen(false)}
                        locationId={locationId}
                        stockTargetName={stockTargetName}
                        ingredients={ingredientOptions}
                        onSuccess={() => {
                            /* Cache auto-invalidated via invalidatesTags: ["Inventory"] on the mutation */
                        }}
                    />
                </>
            ) : null}

            {tab === "waste" ? (
                <form
                    onSubmit={onWaste}
                    className="max-w-lg space-y-3 rounded-2xl border border-hairline p-4"
                >
                    <h3 className="text-[14px] font-semibold">
                        {t("wasteTitle")}
                    </h3>
                    <IngredientSelect
                        label={t("fieldIngredient")}
                        placeholder={t("selectIngredient")}
                        value={wasteForm.ingredientId}
                        options={ingredientOptions}
                        error={
                            wasteTried && !wasteForm.ingredientId
                                ? t("errPickIngredient")
                                : undefined
                        }
                        onChange={v =>
                            setWasteForm(s => ({
                                ...s,
                                ingredientId: v,
                                unit:
                                    ingredientOptions.find(i => i.id === v)
                                        ?.unit ?? "",
                            }))
                        }
                    />
                    <Field
                        label={t("fieldQuantity")}
                        value={wasteForm.quantity}
                        onChange={v =>
                            setWasteForm(s => ({ ...s, quantity: v }))
                        }
                        type="number"
                        error={
                            wasteTried &&
                            parsePositiveQty(wasteForm.quantity) == null
                                ? t("errQtyRequired")
                                : undefined
                        }
                    />
                    <div className="space-y-1 text-[12px]">
                        <span className="font-medium text-slate-gray">
                            {t("colUnit")}
                        </span>
                        <UnitPicker
                            baseUnit={selectedWaste?.unit ?? ""}
                            value={wasteForm.unit || selectedWaste?.unit || ""}
                            onChange={v =>
                                setWasteForm(s => ({ ...s, unit: v }))
                            }
                            disabled={!selectedWaste}
                        />
                    </div>
                    <Field
                        label={t("fieldReason")}
                        value={wasteForm.note}
                        onChange={v => setWasteForm(s => ({ ...s, note: v }))}
                    />
                    {wasteQty > 0 && selectedWaste ? (
                        <div className="rounded-xl bg-destructive/5 px-3 py-2 text-[12px]">
                            <span className="text-slate-gray">
                                {t("wasteLineTotal")}
                            </span>
                            <span className="ml-2 font-medium tabular-nums text-destructive">
                                {formatEtb(wasteTotal)}
                            </span>
                            <span className="ml-2 text-[11px] text-slate-gray">
                                ({formatQty(wasteQty)} ×{" "}
                                {formatEtb(selectedWaste.unitCost)})
                            </span>
                        </div>
                    ) : null}
                    <PrimaryActionButton loading={wasting.isLoading}>
                        {wasting.isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {t("logWaste")}
                    </PrimaryActionButton>
                </form>
            ) : null}

            {tab === "yield" ? (
                <div className="space-y-6">
                    <form
                        onSubmit={onYieldTest}
                        className="max-w-lg space-y-3 rounded-2xl border border-hairline p-4"
                    >
                        <h3 className="text-[14px] font-semibold">
                            {editingYieldId
                                ? t("yieldEditTitle")
                                : t("yieldTitle")}
                        </h3>
                        <p className="text-[12px] text-slate-gray">
                            {t("yieldHint")}
                        </p>
                        <p className="text-[12px] text-slate-gray">
                            {t("yieldPriceHint")}
                        </p>
                        <IngredientSelect
                            label={t("fieldIngredient")}
                            placeholder={t("selectIngredient")}
                            value={yieldForm.ingredientId}
                            options={ingredientOptions}
                            error={
                                yieldTried && !yieldForm.ingredientId
                                    ? t("errPickIngredient")
                                    : undefined
                            }
                            onChange={v => {
                                if (editingYieldId) return;
                                setYieldForm(s => ({
                                    ...s,
                                    ingredientId: v,
                                    unit:
                                        ingredientOptions.find(i => i.id === v)
                                            ?.unit ?? "",
                                }));
                            }}
                        />
                        <div className="space-y-1 text-[12px]">
                            <span className="font-medium text-slate-gray">
                                {t("colUnit")}
                            </span>
                            <UnitPicker
                                baseUnit={selectedYield?.unit ?? ""}
                                value={
                                    yieldForm.unit || selectedYield?.unit || ""
                                }
                                onChange={v =>
                                    setYieldForm(s => ({ ...s, unit: v }))
                                }
                                disabled={!selectedYield}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field
                                label={t("fieldPurchasedQty")}
                                value={yieldForm.purchasedQuantity}
                                onChange={v =>
                                    setYieldForm(s => ({
                                        ...s,
                                        purchasedQuantity: v,
                                    }))
                                }
                                type="number"
                                error={
                                    yieldTried &&
                                    parsePositiveQty(
                                        yieldForm.purchasedQuantity,
                                    ) == null
                                        ? t("errQtyRequired")
                                        : undefined
                                }
                            />
                            <Field
                                label={t("fieldUsableQty")}
                                value={yieldForm.usableQuantity}
                                onChange={v =>
                                    setYieldForm(s => ({
                                        ...s,
                                        usableQuantity: v,
                                    }))
                                }
                                type="number"
                                error={
                                    yieldTried &&
                                    parsePositiveQty(
                                        yieldForm.usableQuantity,
                                    ) == null
                                        ? t("errQtyRequired")
                                        : undefined
                                }
                            />
                        </div>
                        {!editingYieldId ? (
                            <label className="flex items-center gap-2 text-[12px]">
                                <input
                                    type="checkbox"
                                    checked={yieldForm.writeOffTrim}
                                    onChange={e =>
                                        setYieldForm(s => ({
                                            ...s,
                                            writeOffTrim: e.target.checked,
                                        }))
                                    }
                                    className="size-4 rounded border-hairline"
                                />
                                <span>{t("fieldWriteOffTrim")}</span>
                            </label>
                        ) : null}
                        <Field
                            label={t("colNote")}
                            value={yieldForm.note}
                            onChange={v =>
                                setYieldForm(s => ({ ...s, note: v }))
                            }
                        />
                        {yieldPctPreview != null && selectedYield ? (
                            <div className="space-y-1.5 rounded-xl bg-secondary/40 px-3 py-2.5 text-[12px]">
                                <div className="flex justify-between gap-2">
                                    <span className="text-slate-gray">
                                        {t("yieldPercent")}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {yieldPctPreview.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-slate-gray">
                                        {t("apUnitCost")}
                                    </span>
                                    <span className="tabular-nums">
                                        {formatEtb(selectedYield.unitCost)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-slate-gray">
                                        {t("epUnitCost")}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {yieldEpCostPreview != null
                                            ? formatEtb(yieldEpCostPreview)
                                            : "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-slate-gray">
                                        {t("trimQty")}
                                    </span>
                                    <span className="tabular-nums">
                                        {formatQty(yieldTrim)}{" "}
                                        {selectedYield.unit}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                            <PrimaryActionButton
                                loading={
                                    yielding.isLoading ||
                                    updatingYield.isLoading
                                }
                            >
                                {yielding.isLoading ||
                                updatingYield.isLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                {editingYieldId
                                    ? t("saveYieldTest")
                                    : t("postYieldTest")}
                            </PrimaryActionButton>
                            {editingYieldId ? (
                                <button
                                    type="button"
                                    className="h-10 rounded-xl border border-hairline px-3.5 text-[13px]"
                                    onClick={() => resetYieldForm()}
                                >
                                    {t("cancelEditYield")}
                                </button>
                            ) : null}
                        </div>
                    </form>

                    <div>
                        <h3 className="mb-2 text-[14px] font-semibold">
                            {t("registeredYields")}
                        </h3>
                        {yieldTestsLoading ? (
                            <div className="flex items-center gap-2 text-[13px] text-slate-gray">
                                <Loader2 className="size-4 animate-spin" />
                                {t("loadingYields")}
                            </div>
                        ) : (yieldTestsRes?.data ?? []).length === 0 ? (
                            <p className="rounded-2xl border border-hairline px-4 py-6 text-center text-[13px] text-slate-gray">
                                {t("emptyYields")}
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-hairline">
                                <table className="w-full text-left text-[13px]">
                                    <thead className="bg-surface-ivory text-slate-gray">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">
                                                {t("colName")}
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                {t("fieldPurchasedQty")}
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                {t("fieldUsableQty")}
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                {t("yieldPercent")}
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                {t("epUnitCost")}
                                            </th>
                                            <th className="px-4 py-3 font-medium">
                                                {t("colWhen")}
                                            </th>
                                            <th className="px-4 py-3 font-medium text-right">
                                                {t("colActions")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(yieldTestsRes?.data ?? []).map(
                                            row => (
                                                <tr
                                                    key={row.id}
                                                    className="border-t border-hairline"
                                                >
                                                    <td className="px-4 py-3 font-medium">
                                                        {row.ingredient.name}
                                                        <span className="mt-0.5 block text-[11px] font-normal text-slate-gray">
                                                            {
                                                                row.ingredient
                                                                    .unit
                                                            }
                                                            {row.wroteOffTrim
                                                                ? ` · ${t("trimWrittenOff")}`
                                                                : ""}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 tabular-nums">
                                                        {formatQty(
                                                            row.purchasedQuantity,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 tabular-nums">
                                                        {formatQty(
                                                            row.usableQuantity,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium tabular-nums">
                                                        {Number(
                                                            row.yieldPercent,
                                                        ).toFixed(1)}
                                                        %
                                                    </td>
                                                    <td className="px-4 py-3 tabular-nums">
                                                        {formatEtb(
                                                            row.epUnitCost,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-gray">
                                                        {new Date(
                                                            row.createdAt,
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                aria-label={t(
                                                                    "editYield",
                                                                )}
                                                                className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary hover:text-foreground"
                                                                onClick={() =>
                                                                    beginEditYield(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                aria-label={t(
                                                                    "deleteYield",
                                                                )}
                                                                className="rounded-lg p-1.5 text-slate-gray hover:bg-rose-500/10 hover:text-rose-600"
                                                                onClick={() =>
                                                                    askDeleteYield(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {tab === "counts" ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onStartCount}
                            disabled={starting.isLoading}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-[13px] font-semibold text-white disabled:opacity-60"
                        >
                            {starting.isLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {t("startCount")}
                        </button>
                    </div>
                    {!activeCountId ? (
                        <div className="overflow-hidden rounded-2xl border border-hairline">
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colCreated")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colStatus")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colLines")}
                                        </th>
                                        <th className="px-4 py-3 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {(counts.data?.data ?? []).map(row => (
                                        <tr
                                            key={row.id}
                                            className="border-t border-hairline"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    row.createdAt,
                                                ).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.status}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.lineCount}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 hover:underline font-medium"
                                                    onClick={() =>
                                                        setActiveCountId(row.id)
                                                    }
                                                >
                                                    {t("open")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(counts.data?.data ?? []).length === 0 ? (
                                        <EmptyRow text={t("emptyCounts")} />
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="space-y-3 rounded-2xl border border-hairline p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-[14px] font-semibold">
                                    {t("countLabel", {
                                        status:
                                            countDetail.data?.data.status ??
                                            "…",
                                    })}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCountId(null)}
                                        className="rounded-xl border border-hairline px-3 py-2 text-[12px]"
                                    >
                                        {t("back")}
                                    </button>
                                    {countDetail.data?.data.status ===
                                    "DRAFT" ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={onSaveCountLines}
                                                disabled={savingLines.isLoading}
                                                className="rounded-xl border border-hairline px-3 py-2 text-[12px] font-medium"
                                            >
                                                {t("saveLines")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onPostCount}
                                                disabled={posting.isLoading}
                                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-[12px] font-semibold text-white"
                                            >
                                                {t("postCount")}
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                            <table className="w-full text-left text-[13px]">
                                <thead className="text-slate-gray">
                                    <tr>
                                        <th className="py-2 font-medium">
                                            {t("colIngredient")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colBook")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colCounted")}
                                        </th>
                                        <th className="py-2 font-medium">
                                            {t("colVariance")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(countDetail.data?.data.lines ?? []).map(
                                        line => {
                                            const countedRaw =
                                                countEdits[line.ingredientId] ??
                                                (line.countedQty != null
                                                    ? String(line.countedQty)
                                                    : "");
                                            const countedNum =
                                                countedRaw === ""
                                                    ? null
                                                    : Number(countedRaw);
                                            const variance =
                                                countedNum == null
                                                    ? null
                                                    : countedNum - line.bookQty;
                                            return (
                                                <tr
                                                    key={line.id}
                                                    className="border-t border-hairline"
                                                >
                                                    <td className="py-2">
                                                        {line.name}
                                                    </td>
                                                    <td className="py-2">
                                                        {line.bookQty}{" "}
                                                        {line.unit}
                                                    </td>
                                                    <td className="py-2">
                                                        {countDetail.data?.data
                                                            .status ===
                                                        "DRAFT" ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="number"
                                                                    className="h-9 w-24 rounded-lg border border-hairline px-2"
                                                                    value={
                                                                        countedRaw
                                                                    }
                                                                    onChange={e =>
                                                                        setCountEdits(
                                                                            s => ({
                                                                                ...s,
                                                                                [line.ingredientId]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }),
                                                                        )
                                                                    }
                                                                />
                                                                <UnitPicker
                                                                    compact
                                                                    baseUnit={
                                                                        line.unit
                                                                    }
                                                                    value={
                                                                        countUnits[
                                                                            line
                                                                                .ingredientId
                                                                        ] ??
                                                                        line.countedUnit ??
                                                                        line.unit
                                                                    }
                                                                    onChange={v =>
                                                                        setCountUnits(
                                                                            s => ({
                                                                                ...s,
                                                                                [line.ingredientId]:
                                                                                    v,
                                                                            }),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {
                                                                    line.countedQty
                                                                }{" "}
                                                                {line.countedUnit ??
                                                                    line.unit}
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className="py-2">
                                                        {variance == null
                                                            ? "—"
                                                            : variance}
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}

            {tab === "produce" && isNetwork ? (
                <InventoryProductionPanel
                    locationId={
                        locationId ||
                        myBranchStore?.id ||
                        mainLocation?.id ||
                        ""
                    }
                    locationLabel={stockTargetName}
                />
            ) : null}
            {tab === "send" && isNetwork && canOperateCentral ? (
                <SendTransferPanel />
            ) : null}
            {tab === "request" && isNetwork ? <RequestSupplyPanel /> : null}
            {tab === "pending-supply" && isNetwork && canOperateCentral ? (
                <PendingSupplyPanel />
            ) : null}
            {tab === "my-requests" && isNetwork ? (
                <MySupplyRequestsPanel />
            ) : null}
            {tab === "incoming" && isNetwork ? (
                <IncomingTransfersPanel />
            ) : null}
            {tab === "outgoing" && isNetwork && canOperateCentral ? (
                <OutgoingTransfersPanel />
            ) : null}

            {tab === "ledger" ? (
                <div className="space-y-3">
                    <p className="text-[12px] text-slate-gray">
                        {t("ledgerHint")}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-hairline">
                        {ledger.isLoading ? (
                            <LoadingRow />
                        ) : (
                            <table className="w-full text-left text-[13px]">
                                <thead className="bg-surface-ivory text-slate-gray">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colWhen")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colType")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colIngredient")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colDelta")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colCost")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("lineValue")}
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            {t("colStore")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(ledger.data?.data ?? []).map(row => {
                                        const unitCost =
                                            row.unitCost ??
                                            row.unitCostSnapshot ??
                                            0;
                                        const lineValue =
                                            row.lineValue ??
                                            row.quantityDelta * unitCost;
                                        return (
                                            <tr
                                                key={row.id}
                                                className="cursor-pointer border-t border-hairline hover:bg-secondary/40"
                                                onClick={() =>
                                                    router.push(
                                                        `${inventoryBasePath}/ledger/${row.id}`,
                                                    )
                                                }
                                            >
                                                <td className="px-4 py-3">
                                                    {new Date(
                                                        row.createdAt,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {ledgerTypeLabel(
                                                        row.entryType,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.ingredient.name}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums">
                                                    {row.quantityDelta > 0
                                                        ? "+"
                                                        : ""}
                                                    {formatQty(
                                                        row.quantityDelta,
                                                    )}{" "}
                                                    {row.ingredient.unit}
                                                </td>
                                                <td className="px-4 py-3 tabular-nums text-slate-gray">
                                                    {formatEtb(unitCost)}
                                                </td>
                                                <td
                                                    className={cn(
                                                        "px-4 py-3 font-medium tabular-nums",
                                                        lineValue < 0
                                                            ? "text-destructive"
                                                            : "text-foreground",
                                                    )}
                                                >
                                                    {formatEtb(lineValue)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-gray">
                                                    {row.location?.name ?? "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(ledger.data?.data ?? []).length === 0 ? (
                                        <EmptyRow
                                            text={t("emptyLedger")}
                                            colSpan={7}
                                        />
                                    ) : null}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : null}

            {tab === "materials" ? <InventoryMaterialsPanel /> : null}
            {tab === "categories" ? <InventoryCategoriesPanel /> : null}
            {tab === "units" ? <InventoryUnitsPanel /> : null}
            {tab === "vendors" ? <InventoryVendorsPanel /> : null}
            {tab === "drivers" && canOperateCentral ? (
                <InventoryDriversPanel />
            ) : null}

            {meta &&
            meta.totalPages > 1 &&
            tab !== "receive" &&
            tab !== "waste" &&
            tab !== "send" &&
            tab !== "incoming" &&
            tab !== "outgoing" &&
            tab !== "produce" &&
            tab !== "request" &&
            tab !== "pending-supply" &&
            tab !== "my-requests" &&
            tab !== "materials" &&
            tab !== "categories" &&
            tab !== "units" &&
            tab !== "vendors" &&
            tab !== "drivers" ? (
                <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-gray">
                        {t("pageMeta", {
                            page: meta.page,
                            totalPages: meta.totalPages,
                            total: meta.total,
                        })}
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="rounded-lg border border-hairline px-3 py-1.5 disabled:opacity-40"
                        >
                            {t("prev")}
                        </button>
                        <button
                            type="button"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="rounded-lg border border-hairline px-3 py-1.5 disabled:opacity-40"
                        >
                            {t("next")}
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Edit Item Modal */}
            {editingIngredient ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={onSaveIngredientEdit}
                        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-hairline bg-card shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                            <h3 className="text-[16px] font-semibold text-foreground">
                                {t("editIngredient")}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingIngredient(null)}
                                className="rounded-lg p-1.5 text-slate-gray hover:bg-secondary"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="space-y-1 text-[12px]">
                                <span className="font-medium text-slate-gray">
                                    {t("fieldImage")}
                                </span>
                                <ItemImagePicker
                                    value={editIngForm.imageUrl}
                                    onChange={url =>
                                        setEditIngForm(s => ({
                                            ...s,
                                            imageUrl: url,
                                        }))
                                    }
                                    itemName={editIngForm.name}
                                    onSelectPreset={preset => {
                                        const matchingDbCat = dbCategories.find(
                                            c => c.code === preset.category,
                                        );
                                        setEditIngForm(s => ({
                                            ...s,
                                            imageUrl: preset.imageUrl,
                                            ...(matchingDbCat
                                                ? {
                                                      categoryId:
                                                          matchingDbCat.id,
                                                  }
                                                : {}),
                                        }));
                                    }}
                                />
                            </div>

                            <Field
                                label={t("fieldName")}
                                value={editIngForm.name}
                                onChange={v =>
                                    setEditIngForm(s => ({ ...s, name: v }))
                                }
                                required
                            />

                            <div className="space-y-1 text-[12px]">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-gray">
                                        Category
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCategoryModalOpen(true)
                                        }
                                        className="text-[11px] text-emerald-600 hover:underline"
                                    >
                                        + New Category
                                    </button>
                                </div>
                                <InventoryNiceSelect
                                    value={editIngForm.categoryId || "__none__"}
                                    placeholder="Select category..."
                                    options={[
                                        {
                                            value: "__none__",
                                            label: "Select category...",
                                        },
                                        ...dbCategories.map(c => ({
                                            value: c.id,
                                            label: c.amharicName
                                                ? `${c.name} (${c.amharicName})`
                                                : c.name,
                                        })),
                                    ]}
                                    onChange={v =>
                                        setEditIngForm(s => ({
                                            ...s,
                                            categoryId:
                                                v === "__none__" ? "" : v,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("fieldUnit")}
                                    </span>
                                    <InventoryNiceSelect
                                        value={editIngForm.unit}
                                        placeholder={t("fieldUnit")}
                                        options={
                                            unitOptions.length === 0
                                                ? [{ value: "kg", label: "kg" }]
                                                : unitOptions.map(u => ({
                                                      value: u.code,
                                                      label: `${u.name} (${u.code})`,
                                                  }))
                                        }
                                        onChange={v =>
                                            setEditIngForm(s => ({
                                                ...s,
                                                unit: v,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-1 text-[12px]">
                                    <span className="font-medium text-slate-gray">
                                        {t("fieldItemKind")}
                                    </span>
                                    <InventoryNiceSelect
                                        value={editIngForm.itemKind}
                                        placeholder={t("fieldItemKind")}
                                        options={[
                                            {
                                                value: "RAW",
                                                label: t("itemKindRaw"),
                                            },
                                            {
                                                value: "PRODUCED",
                                                label: t("itemKindProduced"),
                                            },
                                            {
                                                value: "FINISHED",
                                                label: t("itemKindFinished"),
                                            },
                                        ]}
                                        onChange={v =>
                                            setEditIngForm(s => ({
                                                ...s,
                                                itemKind:
                                                    v as InventoryItemKind,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field
                                    label={t("fieldUnitCost")}
                                    value={editIngForm.unitCost}
                                    onChange={v =>
                                        setEditIngForm(s => ({
                                            ...s,
                                            unitCost: v,
                                        }))
                                    }
                                    type="number"
                                />

                                <Field
                                    label={t("fieldParLevel")}
                                    value={editIngForm.parLevel}
                                    onChange={v =>
                                        setEditIngForm(s => ({
                                            ...s,
                                            parLevel: v,
                                        }))
                                    }
                                    type="number"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-hairline px-6 py-3 bg-secondary/20">
                            <button
                                type="button"
                                onClick={() => setEditingIngredient(null)}
                                className="rounded-xl border border-hairline bg-card px-4 py-2 text-[13px] font-medium hover:bg-secondary text-slate-gray"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updatingIngredient.isLoading}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-[13px] font-semibold text-white shadow-xs disabled:opacity-60"
                            >
                                {updatingIngredient.isLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                <span>{t("save")}</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {/* Category Manager Modal */}
            <CategoryManagerModal
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onSelectCategory={cat => {
                    setIngForm(s => ({ ...s, categoryId: cat.id }));
                }}
            />

            {/* Units & Conversions Manager Modal */}
            <UnitManagerModal
                open={unitModalOpen}
                onClose={() => setUnitModalOpen(false)}
            />

            {/* Vendors Manager Side Sheet */}
            <VendorManagerSheet
                open={vendorModalOpen}
                onClose={() => setVendorModalOpen(false)}
            />

            {/* Fleet & Driver Management Modal */}
            <DriverManagementModal
                open={driverModalOpen}
                onClose={() => setDriverModalOpen(false)}
            />
        </div>
    );
}

function Field({
    label,
    hint,
    value,
    onChange,
    type = "text",
    required,
    error,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
    error?: string;
}) {
    return (
        <label className="block space-y-1 text-[12px]">
            <span className="font-medium text-slate-gray">{label}</span>
            <input
                type={type}
                required={required}
                min={type === "number" ? "0" : undefined}
                step={type === "number" ? "any" : undefined}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    "h-10 w-full rounded-xl border bg-background px-3 text-[13px]",
                    error ? "border-rose-400" : "border-hairline",
                )}
            />
            {error ? (
                <span className="block text-[11px] text-rose-600">{error}</span>
            ) : hint ? (
                <span className="block text-[11px] leading-snug text-slate-gray/80">
                    {hint}
                </span>
            ) : null}
        </label>
    );
}

function IngredientSelect({
    label,
    placeholder,
    value,
    options,
    onChange,
    error,
}: {
    label: string;
    placeholder: string;
    value: string;
    options: Array<{ id: string; name: string; unit: string }>;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-1 text-[12px]">
            <span className="font-medium text-slate-gray">{label}</span>
            <InventoryNiceSelect
                value={value}
                placeholder={placeholder}
                options={options.map(o => ({
                    value: o.id,
                    label: `${o.name} (${o.unit})`,
                }))}
                onChange={onChange}
                error={error}
            />
        </div>
    );
}

function LoadingRow() {
    return (
        <div className="flex items-center justify-center p-10 text-slate-gray">
            <Loader2 className="size-5 animate-spin" />
        </div>
    );
}

function EmptyRow({ text, colSpan = 5 }: { text: string; colSpan?: number }) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-slate-gray"
            >
                {text}
            </td>
        </tr>
    );
}

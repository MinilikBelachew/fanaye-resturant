"use client";

import { useState } from "react";
import {
    X,
    Building2,
    MapPin,
    UserCheck,
    UtensilsCrossed,
    Check,
    Loader2,
    Layers,
    Sparkles,
    ChefHat,
    Coffee,
    CakeSlice,
    Wine,
} from "lucide-react";
import { useCreateSuperAdminTenantMutation } from "@/context/services/superAdminApi";
import { cn } from "@/lib/utils";

interface CreateTenantSheetProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PLANS = [
    {
        code: "STARTER",
        name: "Starter",
        price: "ETB 2,400/mo",
        badge: "1 Branch",
        desc: "Single location & cash ops",
    },
    {
        code: "PRO",
        name: "Pro Tier",
        price: "ETB 6,800/mo",
        badge: "Recommended",
        desc: "Multi-station KDS & analytics",
    },
    {
        code: "GROWTH",
        name: "Growth",
        price: "ETB 14,500/mo",
        badge: "Up to 5 Branches",
        desc: "Multi-branch & daily close",
    },
    {
        code: "ENTERPRISE",
        name: "Enterprise",
        price: "Custom",
        badge: "Unlimited",
        desc: "Dedicated SLA & multi-brand",
    },
];

const STATIONS_PRESET = [
    { id: "KITCHEN", label: "Kitchen Station", icon: ChefHat },
    { id: "BARISTA", label: "Barista Station", icon: Coffee },
    { id: "CAKES", label: "Cakes & Pastry", icon: CakeSlice },
    { id: "SOFT_DRINKS", label: "Soft Drinks & Bar", icon: Wine },
];

const CITIES = ["Addis Ababa", "Hawassa", "Adama", "Bahir Dar", "Dire Dawa"];

export default function CreateTenantSheet({
    open,
    onClose,
    onSuccess,
}: CreateTenantSheetProps) {
    const [createTenant, { isLoading }] = useCreateSuperAdminTenantMutation();

    // Form state
    const [name, setName] = useState("");
    const [legalName, setLegalName] = useState("");
    const [concept, setConcept] = useState("Casual Dining");
    const [planCode, setPlanCode] = useState("PRO");

    const [branchName, setBranchName] = useState("");
    const [branchCode, setBranchCode] = useState("");
    const [city, setCity] = useState("Addis Ababa");
    const [area, setArea] = useState("Bole");
    const [address, setAddress] = useState("");
    const [hours, setHours] = useState("08:00 – 23:00");

    const [managerName, setManagerName] = useState("");
    const [managerEmail, setManagerEmail] = useState("");
    const [managerPhone, setManagerPhone] = useState("+251 9");
    const [managerPassword, setManagerPassword] = useState("Password123!");

    const [tableCount, setTableCount] = useState(16);
    const [selectedStations, setSelectedStations] = useState<string[]>([
        "KITCHEN",
        "BARISTA",
        "CAKES",
        "SOFT_DRINKS",
    ]);

    const [activeTab, setActiveTab] = useState<
        "company" | "location" | "manager" | "ops"
    >("company");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!open) return null;

    const toggleStation = (stationId: string) => {
        if (selectedStations.includes(stationId)) {
            if (selectedStations.length === 1) return; // Keep at least 1
            setSelectedStations(selectedStations.filter(s => s !== stationId));
        } else {
            setSelectedStations([...selectedStations, stationId]);
        }
    };

    const handleAutoFillBranch = (brandName: string) => {
        setName(brandName);
        if (!branchName) {
            setBranchName(`${brandName} Flagship`);
        }
        if (!branchCode && brandName.trim()) {
            const prefix = brandName
                .trim()
                .slice(0, 3)
                .toUpperCase()
                .replace(/[^A-Z]/g, "ADD");
            setBranchCode(`${prefix}-1`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name.trim()) {
            setErrorMsg("Please enter the restaurant brand name.");
            setActiveTab("company");
            return;
        }
        if (!branchName.trim()) {
            setErrorMsg("Please enter the primary branch name.");
            setActiveTab("location");
            return;
        }
        if (!managerName.trim()) {
            setErrorMsg("Please enter the house manager full name.");
            setActiveTab("manager");
            return;
        }

        try {
            await createTenant({
                name: name.trim(),
                legalName: legalName.trim() || undefined,
                concept: concept.trim() || "Casual Dining",
                planCode,
                city: city.trim() || "Addis Ababa",
                area: area.trim() || "Bole",
                address: address.trim() || `${branchName}, ${city}`,
                phone: managerPhone.trim() || "+251 11 667 2100",
                email: managerEmail.trim() || "hello@restaurant.et",
                managerName: managerName.trim(),
                managerEmail: managerEmail.trim() || undefined,
                managerPhone: managerPhone.trim() || undefined,
                managerPassword: managerPassword || undefined,
                branchName: branchName.trim(),
                branchCode: branchCode.trim() || undefined,
                hours: hours.trim() || "08:00 – 23:00",
                tableCount: Number(tableCount) || 16,
                activeStations: selectedStations,
            }).unwrap();

            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            console.error("Failed to provision tenant:", err);
            const errObj = err as { data?: { message?: string } };
            setErrorMsg(
                errObj?.data?.message ||
                    "Failed to provision tenant. Please check required fields.",
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl border-l border-hairline animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-hairline px-6 py-4.5 bg-card/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold tracking-tight">
                                Provision New Tenant
                            </h2>
                            <p className="text-[12px] text-slate-gray">
                                Create restaurant company, primary branch & manager account
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-gray transition-colors hover:bg-surface-ivory hover:text-foreground"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex border-b border-hairline bg-surface-ivory px-6 py-2 gap-2 overflow-x-auto text-[13px]">
                    <button
                        type="button"
                        onClick={() => setActiveTab("company")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0",
                            activeTab === "company"
                                ? "bg-card text-foreground shadow-xs border border-hairline"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <Building2 className="size-3.5" />
                        1. Company & Plan
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("location")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0",
                            activeTab === "location"
                                ? "bg-card text-foreground shadow-xs border border-hairline"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <MapPin className="size-3.5" />
                        2. Branch & Location
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("manager")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0",
                            activeTab === "manager"
                                ? "bg-card text-foreground shadow-xs border border-hairline"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <UserCheck className="size-3.5" />
                        3. House Manager
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("ops")}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-colors shrink-0",
                            activeTab === "ops"
                                ? "bg-card text-foreground shadow-xs border border-hairline"
                                : "text-slate-gray hover:text-foreground",
                        )}
                    >
                        <UtensilsCrossed className="size-3.5" />
                        4. Floor & KDS Stations
                    </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="mx-6 mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[13px] text-destructive flex items-center justify-between">
                        <span>{errorMsg}</span>
                        <button
                            type="button"
                            onClick={() => setErrorMsg(null)}
                            className="text-xs underline font-semibold"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Form Body (Scrollable) */}
                <form
                    id="create-tenant-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
                >
                    {/* STEP 1: COMPANY & PLAN */}
                    {activeTab === "company" && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    Restaurant Brand Name <span className="text-brand">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Abyssinia Grill & Lounge"
                                    value={name}
                                    onChange={e => handleAutoFillBranch(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                                <p className="mt-1 text-[11px] text-slate-gray">
                                    Customer-facing trade name displayed on POS, digital receipts, and KDS tickets.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Legal Entity Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Abyssinia Hospitality PLC"
                                        value={legalName}
                                        onChange={e => setLegalName(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Culinary Concept / Type
                                    </label>
                                    <select
                                        value={concept}
                                        onChange={e => setConcept(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    >
                                        <option value="Casual Dining">Casual Dining</option>
                                        <option value="Fine Dining & Wine Bar">Fine Dining & Wine Bar</option>
                                        <option value="Cafe & Roastery">Cafe & Roastery</option>
                                        <option value="Grill & Bistro">Grill & Bistro</option>
                                        <option value="Lounge & Nightclub">Lounge & Nightclub</option>
                                        <option value="Fast Casual">Fast Casual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[13px] font-medium text-foreground mb-2">
                                    Select Subscription SLA Plan Tier
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {PLANS.map(p => {
                                        const selected = planCode === p.code;
                                        return (
                                            <div
                                                key={p.code}
                                                onClick={() => setPlanCode(p.code)}
                                                className={cn(
                                                    "cursor-pointer rounded-xl border p-3.5 transition-all text-left relative",
                                                    selected
                                                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                                                        : "border-hairline bg-card hover:border-foreground/30",
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-[14px] text-foreground">
                                                        {p.name}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                            selected
                                                                ? "bg-brand text-white"
                                                                : "bg-surface-ivory text-slate-gray",
                                                        )}
                                                    >
                                                        {p.badge}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[13px] font-medium text-brand">
                                                    {p.price}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-gray">
                                                    {p.desc}
                                                </p>
                                                {selected && (
                                                    <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                                                        <Check className="size-3 stroke-[3]" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: BRANCH & LOCATION */}
                    {activeTab === "location" && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Primary Branch Name <span className="text-brand">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Bole Flagship Branch"
                                        value={branchName}
                                        onChange={e => setBranchName(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Branch Tag / Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. BOLE-1"
                                        value={branchCode}
                                        onChange={e => setBranchCode(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        City Location
                                    </label>
                                    <select
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    >
                                        {CITIES.map(c => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Area / District
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bole Medhanialem"
                                        value={area}
                                        onChange={e => setArea(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    Physical Street Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bole Road, Next to Edna Mall, Addis Ababa"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    Operating Hours
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 08:00 – 23:00"
                                    value={hours}
                                    onChange={e => setHours(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: HOUSE MANAGER ACCOUNT */}
                    {activeTab === "manager" && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    House Manager Full Name <span className="text-brand">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dawit Haile"
                                    value={managerName}
                                    onChange={e => setManagerName(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                />
                                <p className="mt-1 text-[11px] text-slate-gray">
                                    This person will be granted Manager / Owner privileges to manage staff, shifts, and daily close.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Manager Work Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="e.g. manager@restaurant.et"
                                        value={managerEmail}
                                        onChange={e => setManagerEmail(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-foreground">
                                        Manager Phone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+251 91 123 4567"
                                        value={managerPhone}
                                        onChange={e => setManagerPhone(e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    Initial Temporary Password / PIN
                                </label>
                                <input
                                    type="text"
                                    value={managerPassword}
                                    onChange={e => setManagerPassword(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-hairline bg-card px-3.5 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 font-mono"
                                />
                                <p className="mt-1 text-[11px] text-slate-gray">
                                    Can be changed by the manager upon first login.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: FLOOR & KDS STATIONS */}
                    {activeTab === "ops" && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            <div>
                                <label className="block text-[13px] font-medium text-foreground">
                                    Initial Dining Floor Tables
                                </label>
                                <div className="mt-2 flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={tableCount}
                                        onChange={e => setTableCount(Number(e.target.value))}
                                        className="w-32 rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-[15px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
                                    />
                                    <span className="text-[13px] text-slate-gray">
                                        Tables will be provisioned as Table 1 to Table {tableCount} on Main Floor.
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[13px] font-medium text-foreground mb-2">
                                    Active KDS Preparation Stations
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {STATIONS_PRESET.map(st => {
                                        const active = selectedStations.includes(st.id);
                                        const Icon = st.icon;
                                        return (
                                            <div
                                                key={st.id}
                                                onClick={() => toggleStation(st.id)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all",
                                                    active
                                                        ? "border-brand bg-brand/5 text-foreground"
                                                        : "border-hairline bg-card text-slate-gray hover:border-foreground/30",
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "flex size-8 items-center justify-center rounded-lg",
                                                            active
                                                                ? "bg-brand text-white"
                                                                : "bg-surface-ivory text-slate-gray",
                                                        )}
                                                    >
                                                        <Icon className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-medium">
                                                            {st.label}
                                                        </p>
                                                        <p className="text-[11px] text-slate-gray">
                                                            KDS Display queue
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "flex size-5 items-center justify-center rounded-md border transition-colors",
                                                        active
                                                            ? "bg-brand border-brand text-white"
                                                            : "border-hairline bg-surface-ivory",
                                                    )}
                                                >
                                                    {active && <Check className="size-3.5 stroke-[3]" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Provisioning Summary Capsule */}
                            <div className="rounded-xl border border-hairline bg-surface-ivory p-4 text-[13px] space-y-1.5">
                                <div className="flex items-center gap-2 font-semibold text-foreground">
                                    <Sparkles className="size-4 text-brand" />
                                    <span>Provisioning Summary</span>
                                </div>
                                <p className="text-slate-gray">
                                    • <span className="font-medium text-foreground">{name || "New Restaurant"}</span> ({concept})
                                </p>
                                <p className="text-slate-gray">
                                    • Branch: <span className="font-medium text-foreground">{branchName || "Main"}</span> in {city}
                                </p>
                                <p className="text-slate-gray">
                                    • Manager: <span className="font-medium text-foreground">{managerName || "House Manager"}</span>
                                </p>
                                <p className="text-slate-gray">
                                    • Plan: <span className="font-medium text-brand">{planCode}</span> · {tableCount} Tables · {selectedStations.length} KDS Stations
                                </p>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-hairline px-6 py-4 bg-card/80 backdrop-blur">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-hairline px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-surface-ivory transition-colors"
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-3">
                        {activeTab !== "company" && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === "location") setActiveTab("company");
                                    if (activeTab === "manager") setActiveTab("location");
                                    if (activeTab === "ops") setActiveTab("manager");
                                }}
                                className="rounded-xl border border-hairline px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-surface-ivory transition-colors"
                            >
                                Back
                            </button>
                        )}

                        {activeTab !== "ops" ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (activeTab === "company") {
                                        if (!name.trim()) {
                                            setErrorMsg("Please enter the restaurant brand name.");
                                            return;
                                        }
                                        setErrorMsg(null);
                                        setActiveTab("location");
                                    } else if (activeTab === "location") {
                                        if (!branchName.trim()) {
                                            setErrorMsg("Please enter the branch name.");
                                            return;
                                        }
                                        setErrorMsg(null);
                                        setActiveTab("manager");
                                    } else if (activeTab === "manager") {
                                        if (!managerName.trim()) {
                                            setErrorMsg("Please enter the house manager name.");
                                            return;
                                        }
                                        setErrorMsg(null);
                                        setActiveTab("ops");
                                    }
                                }}
                                className="rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90 transition-opacity"
                            >
                                Next Step →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                form="create-tenant-form"
                                disabled={isLoading}
                                className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-brand/90 transition-all disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Provisioning Fleet...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="size-4" />
                                        Provision Tenant
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

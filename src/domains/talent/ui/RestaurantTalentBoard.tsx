"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import {
    useBrowseTalentProfilesQuery,
    useHireTalentToStaffMutation,
    useListTalentRequestsQuery,
    useUpdateTenantTalentRequestMutation,
    type TalentAvailability,
    type TalentProfile,
    type TalentRequestStatus,
    type TalentRoleCategory,
} from "@/context/services/talentApi";
import { toast } from "@/lib/toast";
import {
    ArrowLeft,
    BadgeCheck,
    Briefcase,
    CheckCircle2,
    Mail,
    MapPin,
    Phone,
    Search,
    UserCheck,
    UserPlus,
    X,
} from "lucide-react";
import {
    ALLOWED_TALENT_REQUEST_TRANSITIONS,
    TALENT_AVAILABILITY_LABELS,
    TALENT_REQUEST_STATUS_META,
    TALENT_ROLE_LABELS,
    TalentPagination,
    TalentRequestStatusBadge,
} from "./TalentShared";

const ROLE_OPTIONS: Array<{
    value: "ALL" | TalentRoleCategory;
    label: string;
}> = [
    { value: "ALL", label: "All Roles" },
    { value: "CHEF", label: "Chef" },
    { value: "WAITER", label: "Waiter" },
    { value: "BARISTA", label: "Barista" },
    { value: "CASHIER", label: "Cashier" },
    { value: "BAKER", label: "Baker" },
    { value: "STORE_MANAGER", label: "Store Manager" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "DRIVER", label: "Driver" },
    { value: "CLEANER", label: "Cleaner" },
    { value: "OTHER", label: "Other" },
];

const POS_ROLES = [
    { value: "WAITER", label: "Waiter" },
    { value: "CASHIER", label: "Cashier" },
    { value: "STORE_MANAGER", label: "Store Manager" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "DRIVER", label: "Driver" },
    { value: "MANAGER", label: "Manager" },
];

export default function RestaurantTalentBoard() {
    const t = useTranslations("talent");
    const tCommon = useTranslations("common");
    const [tab, setTab] = useState<"browse" | "requests">("browse");

    // Browse filters
    const [browsePage, setBrowsePage] = useState(1);
    const [roleCategory, setRoleCategory] = useState<
        "ALL" | TalentRoleCategory
    >("ALL");
    const [availability, setAvailability] = useState<
        "ALL" | TalentAvailability
    >("ALL");
    const [location, setLocation] = useState("");
    const [minExperience, setMinExperience] = useState<string>("");
    const [browseSearch, setBrowseSearch] = useState("");

    // Requests filters
    const [reqPage, setReqPage] = useState(1);
    const [reqStatus, setReqStatus] = useState<"ALL" | TalentRequestStatus>(
        "ALL",
    );
    const [reqSearch, setReqSearch] = useState("");

    // Side sheet state
    const [selectedProfile, setSelectedProfile] =
        useState<TalentProfile | null>(null);
    const [hireTarget, setHireTarget] = useState<TalentProfile | null>(null);
    const [branchId, setBranchId] = useState("");
    const [posRoleCode, setPosRoleCode] = useState("WAITER");
    const [pin, setPin] = useState("");
    const [contactNotes, setContactNotes] = useState("");

    const { data: branchesData } = useListBranchesQuery();
    const branches = branchesData?.data ?? [];

    const { data: browseData, isLoading: isLoadingBrowse } =
        useBrowseTalentProfilesQuery({
            page: browsePage,
            limit: 12,
            roleCategory: roleCategory === "ALL" ? undefined : roleCategory,
            availability: availability === "ALL" ? undefined : availability,
            location: location.trim() || undefined,
            minExperience:
                minExperience !== "" ? Number(minExperience) : undefined,
            search: browseSearch.trim() || undefined,
        });

    const { data: requestsData, isLoading: isLoadingRequests } =
        useListTalentRequestsQuery({
            page: reqPage,
            limit: 10,
            status: reqStatus === "ALL" ? undefined : reqStatus,
            search: reqSearch.trim() || undefined,
        });

    const [hireToStaff, { isLoading: isHiring }] =
        useHireTalentToStaffMutation();
    const [updateRequest] = useUpdateTenantTalentRequestMutation();

    const openProfileSheet = (profile: TalentProfile) => {
        setSelectedProfile(profile);
        setHireTarget(null);
    };

    const openHireSheet = (profile: TalentProfile) => {
        setHireTarget(profile);
        setBranchId(branches[0]?.id ?? "");
        const defaultRole =
            profile.roleCategory === "CASHIER" ||
            profile.roleCategory === "STORE_MANAGER" ||
            profile.roleCategory === "RECEPTIONIST" ||
            profile.roleCategory === "DRIVER"
                ? profile.roleCategory
                : "WAITER";
        setPosRoleCode(defaultRole);
        setPin("");
        setContactNotes("");
    };

    const handleHireToStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hireTarget) return;
        if (branches.length > 0 && !branchId) {
            toast.error(t("branchRequired"));
            return;
        }
        if (!posRoleCode) {
            toast.error(t("roleRequired"));
            return;
        }
        if (pin.trim().length < 4) {
            toast.error(t("pinMinLength"));
            return;
        }

        try {
            await hireToStaff({
                talentProfileId: hireTarget.id,
                branchId: branchId || undefined,
                roleCode: posRoleCode,
                pin: pin.trim(),
                notes: contactNotes.trim() || undefined,
            }).unwrap();
            toast.success(t("hiredSuccess", { name: hireTarget.fullName }));
            setHireTarget(null);
            setSelectedProfile(null);
            setTab("requests");
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to hire & onboard candidate.";
            toast.error(msg);
        }
    };

    const handleReqStatusChange = async (
        id: string,
        status: TalentRequestStatus,
    ) => {
        try {
            await updateRequest({ id, status }).unwrap();
            toast.success(
                `Updated to ${TALENT_REQUEST_STATUS_META[status].label}.`,
            );
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to update status.";
            toast.error(msg);
        }
    };

    const profiles = browseData?.items ?? [];
    const requests = requestsData?.items ?? [];
    const reqCounts = requestsData?.counts;

    return (
        <div className="space-y-5">
            {/* Top Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab("browse")}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        tab === "browse"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                >
                    <UserPlus className="h-4 w-4" />
                    Browse Talent
                </button>
                <button
                    type="button"
                    onClick={() => setTab("requests")}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        tab === "requests"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                >
                    <UserCheck className="h-4 w-4" />
                    My Requests
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            tab === "requests"
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-foreground"
                        }`}
                    >
                        {reqCounts?.ALL ?? 0}
                    </span>
                </button>
            </div>

            {tab === "browse" ? (
                <>
                    {/* Filters */}
                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={browseSearch}
                                    onChange={e => {
                                        setBrowseSearch(e.target.value);
                                        setBrowsePage(1);
                                    }}
                                    placeholder={t("searchPlaceholder")}
                                    className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                                />
                            </div>
                            <input
                                type="text"
                                value={location}
                                onChange={e => {
                                    setLocation(e.target.value);
                                    setBrowsePage(1);
                                }}
                                placeholder={t("locationPlaceholder")}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                            <select
                                value={availability}
                                onChange={e => {
                                    setAvailability(
                                        e.target.value as
                                            | "ALL"
                                            | TalentAvailability,
                                    );
                                    setBrowsePage(1);
                                }}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            >
                                <option value="ALL">
                                    {t("allAvailability")}
                                </option>
                                {Object.entries(TALENT_AVAILABILITY_LABELS).map(
                                    ([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ),
                                )}
                            </select>
                            <input
                                type="number"
                                min={0}
                                value={minExperience}
                                onChange={e => {
                                    setMinExperience(e.target.value);
                                    setBrowsePage(1);
                                }}
                                placeholder="Min years experience"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {ROLE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setRoleCategory(opt.value);
                                        setBrowsePage(1);
                                    }}
                                    className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                                        roleCategory === opt.value
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoadingBrowse ? (
                        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                            Loading talent pool...
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                            No candidates match your filters right now.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {profiles.map(p => (
                                    <div
                                        key={p.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-primary-border hover:shadow-md"
                                    >
                                        <div className="relative h-44 w-full overflow-hidden bg-muted">
                                            {p.photoUrl ? (
                                                <img
                                                    src={
                                                        filePublicUrl(
                                                            p.photoUrl,
                                                        ) ?? p.photoUrl
                                                    }
                                                    alt={p.fullName}
                                                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-muted text-2xl font-bold tracking-wide text-primary">
                                                    {p.fullName
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                                                <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-xs backdrop-blur-xs">
                                                    {
                                                        TALENT_AVAILABILITY_LABELS[
                                                            p.availability
                                                        ]
                                                    }
                                                </span>
                                                {p.isVerified ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/95 px-2.5 py-1 text-[11px] font-medium text-white shadow-xs">
                                                        <BadgeCheck className="h-3.5 w-3.5" />
                                                        Verified
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col justify-between p-4">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-base font-semibold text-foreground">
                                                            {p.fullName}
                                                        </h3>
                                                        <p className="truncate text-xs font-medium text-primary">
                                                            {p.roleTitle} •{" "}
                                                            {
                                                                TALENT_ROLE_LABELS[
                                                                    p
                                                                        .roleCategory
                                                                ]
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {p.location}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Briefcase className="h-3.5 w-3.5" />
                                                        {p.yearsExperience} yrs
                                                        exp
                                                    </span>
                                                </div>

                                                {p.bio ? (
                                                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                                        {p.bio}
                                                    </p>
                                                ) : null}

                                                {p.skills.length > 0 ? (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {p.skills
                                                            .slice(0, 4)
                                                            .map(skill => (
                                                                <span
                                                                    key={skill}
                                                                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        {p.skills.length > 4 ? (
                                                            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                                                                +
                                                                {p.skills
                                                                    .length - 4}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="mt-4 border-t border-border pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openProfileSheet(p)
                                                    }
                                                    className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                                                >
                                                    View & Contact
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border bg-card">
                                <TalentPagination
                                    page={browseData?.page ?? browsePage}
                                    limit={browseData?.limit ?? 12}
                                    total={browseData?.total ?? 0}
                                    totalPages={browseData?.totalPages ?? 1}
                                    onPageChange={setBrowsePage}
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* My Requests Tab */
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={reqSearch}
                                onChange={e => {
                                    setReqSearch(e.target.value);
                                    setReqPage(1);
                                }}
                                placeholder="Search candidate..."
                                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(
                                [
                                    "ALL",
                                    "CONTACTED",
                                    "INTERVIEWING",
                                    "HIRED",
                                    "CANCELLED",
                                ] as const
                            ).map(st => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                        setReqStatus(st);
                                        setReqPage(1);
                                    }}
                                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                                        reqStatus === st
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {st === "ALL"
                                        ? "All"
                                        : TALENT_REQUEST_STATUS_META[st]
                                              .label}{" "}
                                    ({reqCounts ? reqCounts[st] : 0})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Candidate
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Branch
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoadingRequests ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                Loading requests...
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                No logged contacts or hires yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map(r => {
                                            const nextLegal =
                                                ALLOWED_TALENT_REQUEST_TRANSITIONS[
                                                    r.status
                                                ] ?? [];
                                            return (
                                                <tr
                                                    key={r.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-foreground">
                                                            {
                                                                r.talentProfile
                                                                    .fullName
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                r.talentProfile
                                                                    .roleTitle
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-foreground">
                                                        <div>
                                                            {
                                                                r.talentProfile
                                                                    .phone
                                                            }
                                                        </div>
                                                        {r.talentProfile
                                                            .email ? (
                                                            <div className="text-muted-foreground">
                                                                {
                                                                    r
                                                                        .talentProfile
                                                                        .email
                                                                }
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {r.branchName ?? "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {nextLegal.length >
                                                        0 ? (
                                                            <select
                                                                value={r.status}
                                                                onChange={e =>
                                                                    handleReqStatusChange(
                                                                        r.id,
                                                                        e.target
                                                                            .value as TalentRequestStatus,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                                                            >
                                                                <option
                                                                    value={
                                                                        r.status
                                                                    }
                                                                >
                                                                    {
                                                                        TALENT_REQUEST_STATUS_META[
                                                                            r
                                                                                .status
                                                                        ].label
                                                                    }
                                                                </option>
                                                                {nextLegal.map(
                                                                    st => (
                                                                        <option
                                                                            key={
                                                                                st
                                                                            }
                                                                            value={
                                                                                st
                                                                            }
                                                                        >
                                                                            →{" "}
                                                                            {
                                                                                TALENT_REQUEST_STATUS_META[
                                                                                    st
                                                                                ]
                                                                                    .label
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        ) : (
                                                            <TalentRequestStatusBadge
                                                                status={
                                                                    r.status
                                                                }
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {!r.onboardedMembershipId &&
                                                        r.status !==
                                                            "CANCELLED" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openProfileSheet(
                                                                        r.talentProfile,
                                                                    )
                                                                }
                                                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                                            >
                                                                Hire to Staff
                                                            </button>
                                                        ) : r.onboardedMembershipId ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Onboarded
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TalentPagination
                            page={requestsData?.page ?? reqPage}
                            limit={requestsData?.limit ?? 10}
                            total={requestsData?.total ?? 0}
                            totalPages={requestsData?.totalPages ?? 1}
                            onPageChange={setReqPage}
                        />
                    </div>
                </div>
            )}

            {/* Right-Side Profile & 1-Click Hire Sheet */}
            {selectedProfile ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setSelectedProfile(null)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                            <div className="flex items-center gap-3.5">
                                {selectedProfile.photoUrl ? (
                                    <img
                                        src={
                                            filePublicUrl(
                                                selectedProfile.photoUrl,
                                            ) ?? selectedProfile.photoUrl
                                        }
                                        alt={selectedProfile.fullName}
                                        className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover shadow-xs"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary-soft text-xl font-bold text-primary">
                                        {selectedProfile.fullName
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h2 className="truncate text-lg font-bold text-foreground">
                                            {selectedProfile.fullName}
                                        </h2>
                                        {selectedProfile.isVerified ? (
                                            <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />
                                        ) : null}
                                    </div>
                                    <p className="text-xs font-medium text-primary">
                                        {selectedProfile.roleTitle} •{" "}
                                        {
                                            TALENT_ROLE_LABELS[
                                                selectedProfile.roleCategory
                                            ]
                                        }
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                                            {
                                                TALENT_AVAILABILITY_LABELS[
                                                    selectedProfile.availability
                                                ]
                                            }
                                        </span>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                            {selectedProfile.yearsExperience}{" "}
                                            yrs exp
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedProfile(null)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 space-y-4 text-sm">
                            {/* Contact Info (visible immediately, NOT logged until user clicks an action) */}
                            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                                <div className="text-xs font-semibold uppercase text-muted-foreground">
                                    Direct Contact
                                </div>
                                <div className="mt-2 space-y-1.5">
                                    <a
                                        href={`tel:${selectedProfile.phone}`}
                                        className="flex items-center gap-2 font-medium text-foreground hover:text-primary"
                                    >
                                        <Phone className="h-4 w-4 text-primary" />
                                        {selectedProfile.phone}
                                    </a>
                                    {selectedProfile.email ? (
                                        <a
                                            href={`mailto:${selectedProfile.email}`}
                                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
                                        >
                                            <Mail className="h-3.5 w-3.5" />
                                            {selectedProfile.email}
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg border border-border p-2.5">
                                    <span className="text-muted-foreground">
                                        Location:
                                    </span>{" "}
                                    <strong className="text-foreground">
                                        {selectedProfile.location}
                                    </strong>
                                </div>
                                <div className="rounded-lg border border-border p-2.5">
                                    <span className="text-muted-foreground">
                                        Experience:
                                    </span>{" "}
                                    <strong className="text-foreground">
                                        {selectedProfile.yearsExperience} years
                                    </strong>
                                </div>
                            </div>

                            {selectedProfile.bio ? (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {selectedProfile.bio}
                                </p>
                            ) : null}

                            {selectedProfile.skills.length > 0 ? (
                                <div>
                                    <div className="mb-1.5 text-xs font-medium text-foreground">
                                        Skills
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedProfile.skills.map(s => (
                                            <span
                                                key={s}
                                                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Hire Action */}
                            <div className="border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openHireSheet(selectedProfile)
                                    }
                                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    Hire & Add to Staff
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Second Sheet: Hire & Onboard Details */}
            {hireTarget ? (
                <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setHireTarget(null)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setHireTarget(null)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                    title="Back to profile"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        {t("hireTitle")}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {t("hireSubtitle")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setHireTarget(null);
                                    setSelectedProfile(null);
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                            {hireTarget.photoUrl ? (
                                <img
                                    src={
                                        filePublicUrl(hireTarget.photoUrl) ??
                                        hireTarget.photoUrl
                                    }
                                    alt={hireTarget.fullName}
                                    className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
                                />
                            ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-soft text-sm font-bold text-primary">
                                    {hireTarget.fullName
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {hireTarget.fullName}
                                </p>
                                <p className="truncate text-xs text-primary">
                                    {hireTarget.roleTitle} • {hireTarget.phone}
                                </p>
                            </div>
                        </div>

                        <form
                            onSubmit={handleHireToStaff}
                            className="mt-5 flex flex-1 flex-col justify-between space-y-4"
                        >
                            <div className="space-y-4">
                                {branches.length > 0 ? (
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            {t("branchLabel")}
                                        </label>
                                        <select
                                            required
                                            value={branchId}
                                            onChange={e =>
                                                setBranchId(e.target.value)
                                            }
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        >
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        {t("posRoleLabel")}
                                    </label>
                                    <select
                                        required
                                        value={posRoleCode}
                                        onChange={e =>
                                            setPosRoleCode(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        {POS_ROLES.map(r => (
                                            <option
                                                key={r.value}
                                                value={r.value}
                                            >
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        {t("pinLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        minLength={4}
                                        value={pin}
                                        onChange={e => setPin(e.target.value)}
                                        placeholder={t("pinPlaceholder")}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {t("pinHint")}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        {t("notesLabel")}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={contactNotes}
                                        onChange={e =>
                                            setContactNotes(e.target.value)
                                        }
                                        placeholder={t("notesPlaceholder")}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setHireTarget(null)}
                                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    {tCommon("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isHiring}
                                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {isHiring ? t("hiring") : t("confirmHire")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

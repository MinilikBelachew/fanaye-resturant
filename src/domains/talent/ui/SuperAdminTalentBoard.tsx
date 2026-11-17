"use client";

import { useState } from "react";
import { useUploadMenuImageMutation } from "@/context/services/menuApi";
import {
    useCreateSuperAdminTalentProfileMutation,
    useListSuperAdminTalentProfilesQuery,
    useListSuperAdminTalentRequestsQuery,
    useUpdateSuperAdminTalentProfileMutation,
    useUpdateSuperAdminTalentRequestMutation,
    type TalentAvailability,
    type TalentProfile,
    type TalentProfileStatus,
    type TalentRequestStatus,
    type TalentRoleCategory,
} from "@/context/services/talentApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Link } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import {
    ArrowUpRight,
    BadgeCheck,
    Building2,
    Camera,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    Users,
    X,
} from "lucide-react";
import {
    ALLOWED_TALENT_REQUEST_TRANSITIONS,
    TALENT_AVAILABILITY_LABELS,
    TALENT_REQUEST_STATUS_META,
    TALENT_ROLE_LABELS,
    TalentPagination,
    TalentProfileStatusBadge,
    TalentRequestStatusBadge,
} from "./TalentShared";

export default function SuperAdminTalentBoard() {
    const [tab, setTab] = useState<"pool" | "requests">("pool");

    // Pool state
    const [poolPage, setPoolPage] = useState(1);
    const [poolStatus, setPoolStatus] = useState<"ALL" | TalentProfileStatus>(
        "ALL",
    );
    const [poolSearch, setPoolSearch] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<TalentProfile | null>(null);

    // Form state
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [roleCategory, setRoleCategory] =
        useState<TalentRoleCategory>("CHEF");
    const [roleTitle, setRoleTitle] = useState("");
    const [location, setLocation] = useState("Bole");
    const [yearsExperience, setYearsExperience] = useState(2);
    const [availability, setAvailability] =
        useState<TalentAvailability>("FULL_TIME");
    const [skillsText, setSkillsText] = useState("");
    const [bio, setBio] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [profileStatus, setProfileStatus] =
        useState<TalentProfileStatus>("AVAILABLE");

    // Requests state
    const [reqPage, setReqPage] = useState(1);
    const [reqStatus, setReqStatus] = useState<"ALL" | TalentRequestStatus>(
        "ALL",
    );
    const [reqSearch, setReqSearch] = useState("");

    const { data: poolData, isLoading: isLoadingPool } =
        useListSuperAdminTalentProfilesQuery({
            page: poolPage,
            limit: 12,
            status: poolStatus === "ALL" ? undefined : poolStatus,
            search: poolSearch.trim() || undefined,
        });

    const { data: reqData, isLoading: isLoadingReq } =
        useListSuperAdminTalentRequestsQuery({
            page: reqPage,
            limit: 10,
            status: reqStatus === "ALL" ? undefined : reqStatus,
            search: reqSearch.trim() || undefined,
        });

    const [createProfile, { isLoading: isCreating }] =
        useCreateSuperAdminTalentProfileMutation();
    const [updateProfile, { isLoading: isSaving }] =
        useUpdateSuperAdminTalentProfileMutation();
    const [uploadPhoto, { isLoading: isUploadingPhoto }] =
        useUploadMenuImageMutation();
    const [updateRequest] = useUpdateSuperAdminTalentRequestMutation();

    const openCreateSheet = () => {
        setEditing(null);
        setFullName("");
        setPhone("");
        setEmail("");
        setRoleCategory("CHEF");
        setRoleTitle("");
        setLocation("Bole");
        setYearsExperience(2);
        setAvailability("FULL_TIME");
        setSkillsText("");
        setBio("");
        setPhotoUrl("");
        setProfileStatus("AVAILABLE");
        setSheetOpen(true);
    };

    const openEditSheet = (p: TalentProfile) => {
        setEditing(p);
        setFullName(p.fullName);
        setPhone(p.phone);
        setEmail(p.email ?? "");
        setRoleCategory(p.roleCategory);
        setRoleTitle(p.roleTitle);
        setLocation(p.location);
        setYearsExperience(p.yearsExperience);
        setAvailability(p.availability);
        setSkillsText(p.skills.join(", "));
        setBio(p.bio ?? "");
        setPhotoUrl(p.photoUrl ?? "");
        setProfileStatus(p.status);
        setSheetOpen(true);
    };

    const handlePhotoChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await uploadPhoto(file).unwrap();
            setPhotoUrl(res.file.path);
            toast.success("Photo uploaded.");
        } catch {
            toast.error("Failed to upload photo.");
        } finally {
            e.target.value = "";
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const skills = skillsText
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        try {
            if (editing) {
                await updateProfile({
                    id: editing.id,
                    fullName,
                    phone,
                    email: email.trim() || undefined,
                    photoUrl: photoUrl.trim() || undefined,
                    roleCategory,
                    roleTitle,
                    location,
                    yearsExperience: Number(yearsExperience),
                    availability,
                    skills,
                    bio: bio.trim() || undefined,
                    status: profileStatus,
                }).unwrap();
                toast.success("Candidate profile updated.");
            } else {
                await createProfile({
                    fullName,
                    phone,
                    email: email.trim() || undefined,
                    photoUrl: photoUrl.trim() || undefined,
                    roleCategory,
                    roleTitle,
                    location,
                    yearsExperience: Number(yearsExperience),
                    availability,
                    skills,
                    bio: bio.trim() || undefined,
                }).unwrap();
                toast.success("Candidate added to Talent Pool.");
            }
            setSheetOpen(false);
        } catch (err: unknown) {
            const msg =
                (err as { data?: { message?: string } })?.data?.message ??
                "Failed to save candidate.";
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

    const profiles = poolData?.items ?? [];
    const requests = reqData?.items ?? [];
    const reqCounts = reqData?.counts;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTab("pool")}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                            tab === "pool"
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Talent Pool ({poolData?.counts?.ALL ?? 0})
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
                        Hire & Contact Requests ({reqCounts?.ALL ?? 0})
                    </button>
                </div>

                {tab === "pool" ? (
                    <button
                        type="button"
                        onClick={openCreateSheet}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Talent
                    </button>
                ) : null}
            </div>

            {tab === "pool" ? (
                <>
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={poolSearch}
                                onChange={e => {
                                    setPoolSearch(e.target.value);
                                    setPoolPage(1);
                                }}
                                placeholder="Search name, role, location..."
                                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(
                                [
                                    "ALL",
                                    "AVAILABLE",
                                    "IN_PROCESS",
                                    "HIRED",
                                    "ARCHIVED",
                                ] as const
                            ).map(st => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                        setPoolStatus(st);
                                        setPoolPage(1);
                                    }}
                                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                                        poolStatus === st
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {st === "ALL" ? "All" : st} (
                                    {poolData?.counts ? poolData.counts[st] : 0}
                                    )
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
                                            Location & Exp
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Contact
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Edit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoadingPool ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                Loading talent pool...
                                            </td>
                                        </tr>
                                    ) : profiles.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                No candidates yet. Click{" "}
                                                <strong>Add Talent</strong> to
                                                post one.
                                            </td>
                                        </tr>
                                    ) : (
                                        profiles.map(p => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {p.photoUrl ? (
                                                            <img
                                                                src={
                                                                    filePublicUrl(
                                                                        p.photoUrl,
                                                                    ) ??
                                                                    p.photoUrl
                                                                }
                                                                alt={p.fullName}
                                                                className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-soft text-xs font-bold text-primary">
                                                                {p.fullName
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-1 font-medium text-foreground">
                                                                <span>
                                                                    {p.fullName}
                                                                </span>
                                                                {p.isVerified ? (
                                                                    <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                                                                ) : null}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {p.roleTitle} (
                                                                {
                                                                    TALENT_ROLE_LABELS[
                                                                        p
                                                                            .roleCategory
                                                                    ]
                                                                }
                                                                )
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <div className="flex items-center gap-1 text-foreground">
                                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {p.location}
                                                    </div>
                                                    <div className="mt-0.5 text-muted-foreground">
                                                        {p.yearsExperience} yrs
                                                        •{" "}
                                                        {
                                                            TALENT_AVAILABILITY_LABELS[
                                                                p.availability
                                                            ]
                                                        }
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    <div className="text-foreground">
                                                        {p.phone}
                                                    </div>
                                                    {p.email ? (
                                                        <div className="text-muted-foreground">
                                                            {p.email}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <TalentProfileStatusBadge
                                                        status={p.status}
                                                    />
                                                    {p.hiredByTenantName ? (
                                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                                            by{" "}
                                                            {
                                                                p.hiredByTenantName
                                                            }
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditSheet(p)
                                                        }
                                                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TalentPagination
                            page={poolData?.page ?? poolPage}
                            limit={poolData?.limit ?? 12}
                            total={poolData?.total ?? 0}
                            totalPages={poolData?.totalPages ?? 1}
                            onPageChange={setPoolPage}
                        />
                    </div>
                </>
            ) : (
                /* Hire & Contact Requests Tab */
                <>
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
                                placeholder="Search restaurant or candidate..."
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
                                            Restaurant & Candidate
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Role & Location
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoadingReq ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                Loading requests...
                                            </td>
                                        </tr>
                                    ) : requests.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                No hire or contact requests yet.
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
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            <span>
                                                                {r.tenantName ??
                                                                    "Restaurant"}
                                                            </span>
                                                        </div>
                                                        <div className="mt-0.5 font-medium text-foreground">
                                                            {
                                                                r.talentProfile
                                                                    .fullName
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        <div className="text-foreground">
                                                            {
                                                                r.talentProfile
                                                                    .roleTitle
                                                            }
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            {
                                                                r.talentProfile
                                                                    .location
                                                            }
                                                        </div>
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
                                                                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
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
                                                        <Link
                                                            href={`/super-admin/talent/requests/${r.id}`}
                                                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                                                        >
                                                            <span>View</span>
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TalentPagination
                            page={reqData?.page ?? reqPage}
                            limit={reqData?.limit ?? 10}
                            total={reqData?.total ?? 0}
                            totalPages={reqData?.totalPages ?? 1}
                            onPageChange={setReqPage}
                        />
                    </div>
                </>
            )}

            {/* Add / Edit Talent Right-Side Sheet */}
            {sheetOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                    <div
                        className="fixed inset-0"
                        onClick={() => setSheetOpen(false)}
                    />
                    <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl">
                        <div className="flex items-start justify-between border-b border-border px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    {editing ? "Edit Candidate" : "Add Talent"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {editing
                                        ? "Update candidate profile details and availability."
                                        : "Add a candidate to the verified talent pool."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSheetOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveProfile}
                            className="flex flex-1 flex-col overflow-y-auto px-6 py-5"
                        >
                            <div className="flex-1 space-y-4">
                                {/* Photo Upload Card */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                                        Candidate Photo (Optional)
                                    </label>
                                    {photoUrl ? (
                                        <div className="group relative h-44 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                                            <img
                                                src={
                                                    filePublicUrl(photoUrl) ??
                                                    photoUrl
                                                }
                                                alt="Candidate preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-x-3 bottom-3 flex items-center justify-end gap-2">
                                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-xs transition hover:bg-background">
                                                    <Upload className="h-3.5 w-3.5" />
                                                    <span>
                                                        {isUploadingPhoto
                                                            ? "Uploading..."
                                                            : "Change"}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        disabled={
                                                            isUploadingPhoto
                                                        }
                                                        onChange={
                                                            handlePhotoChange
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPhotoUrl("")
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-center transition hover:border-primary/50 hover:bg-muted/50">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                                                <Camera className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">
                                                    {isUploadingPhoto
                                                        ? "Uploading photo..."
                                                        : "Click to upload candidate photo"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                    PNG, JPG or WebP portrait
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={isUploadingPhoto}
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={e =>
                                            setFullName(e.target.value)
                                        }
                                        placeholder="e.g. Abebe Kebede"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Phone
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={phone}
                                            onChange={e =>
                                                setPhone(e.target.value)
                                            }
                                            placeholder="+2519..."
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e =>
                                                setEmail(e.target.value)
                                            }
                                            placeholder="name@email.com"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Category
                                        </label>
                                        <select
                                            value={roleCategory}
                                            onChange={e =>
                                                setRoleCategory(
                                                    e.target
                                                        .value as TalentRoleCategory,
                                                )
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        >
                                            {Object.entries(
                                                TALENT_ROLE_LABELS,
                                            ).map(([k, v]) => (
                                                <option key={k} value={k}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Role Title
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={roleTitle}
                                            onChange={e =>
                                                setRoleTitle(e.target.value)
                                            }
                                            placeholder="e.g. Grill Chef"
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={location}
                                            onChange={e =>
                                                setLocation(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Years Experience
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            required
                                            value={yearsExperience}
                                            onChange={e =>
                                                setYearsExperience(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        />
                                    </div>
                                </div>
                                <div
                                    className={
                                        editing ? "grid grid-cols-2 gap-3" : ""
                                    }
                                >
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-foreground">
                                            Availability
                                        </label>
                                        <select
                                            value={availability}
                                            onChange={e =>
                                                setAvailability(
                                                    e.target
                                                        .value as TalentAvailability,
                                                )
                                            }
                                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        >
                                            {Object.entries(
                                                TALENT_AVAILABILITY_LABELS,
                                            ).map(([k, v]) => (
                                                <option key={k} value={k}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {editing ? (
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-foreground">
                                                Status
                                            </label>
                                            <select
                                                value={profileStatus}
                                                onChange={e =>
                                                    setProfileStatus(
                                                        e.target
                                                            .value as TalentProfileStatus,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                            >
                                                <option value="AVAILABLE">
                                                    Available
                                                </option>
                                                <option value="IN_PROCESS">
                                                    In Process
                                                </option>
                                                <option value="HIRED">
                                                    Hired
                                                </option>
                                                <option value="ARCHIVED">
                                                    Archived
                                                </option>
                                            </select>
                                        </div>
                                    ) : null}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Skills (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={skillsText}
                                        onChange={e =>
                                            setSkillsText(e.target.value)
                                        }
                                        placeholder="Tibs, Grill, POS, English"
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-foreground">
                                        Bio (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        placeholder="Short summary of experience, languages, or shift preferences..."
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSheetOpen(false)}
                                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isSaving}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                    {isCreating || isSaving
                                        ? "Saving..."
                                        : "Save Candidate"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

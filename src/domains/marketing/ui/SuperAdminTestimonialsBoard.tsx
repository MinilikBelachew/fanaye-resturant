"use client";

import { useState } from "react";
import {
    useCreateTestimonialMutation,
    useDeleteTestimonialMutation,
    useListSuperAdminTestimonialsQuery,
    useUpdateTestimonialMutation,
    type LandingTestimonial,
} from "@/context/services/testimonialsApi";
import { filePublicUrl } from "@/domains/catalog/application/mapAdminMenu";
import { Edit3, Eye, EyeOff, Plus, Star, Trash2, X } from "lucide-react";

interface FormState {
    authorName: string;
    authorRole: string;
    restaurantName: string;
    quote: string;
    photoUrl: string;
    rating: number;
    sortOrder: number;
    isPublished: boolean;
}

const EMPTY_FORM: FormState = {
    authorName: "",
    authorRole: "Owner & General Manager",
    restaurantName: "",
    quote: "",
    photoUrl: "",
    rating: 5,
    sortOrder: 0,
    isPublished: true,
};

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() ?? "")
        .join("");
}

export default function SuperAdminTestimonialsBoard() {
    const { data, isLoading } = useListSuperAdminTestimonialsQuery();
    const [createTestimonial, { isLoading: isCreating }] =
        useCreateTestimonialMutation();
    const [updateTestimonial, { isLoading: isUpdating }] =
        useUpdateTestimonialMutation();
    const [deleteTestimonial] = useDeleteTestimonialMutation();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const items = data?.items ?? [];

    const openCreate = () => {
        setEditingId(null);
        setForm({
            ...EMPTY_FORM,
            sortOrder: items.length + 1,
        });
        setErrorMsg(null);
        setShowForm(true);
    };

    const openEdit = (item: LandingTestimonial) => {
        setEditingId(item.id);
        setForm({
            authorName: item.authorName,
            authorRole: item.authorRole,
            restaurantName: item.restaurantName,
            quote: item.quote,
            photoUrl: item.photoUrl ?? "",
            rating: item.rating,
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
        });
        setErrorMsg(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        try {
            const payload = {
                authorName: form.authorName.trim(),
                authorRole: form.authorRole.trim(),
                restaurantName: form.restaurantName.trim(),
                quote: form.quote.trim(),
                photoUrl: form.photoUrl.trim() || null,
                rating: Number(form.rating) || 5,
                sortOrder: Number(form.sortOrder) || 0,
                isPublished: form.isPublished,
            };

            if (editingId) {
                await updateTestimonial({
                    id: editingId,
                    body: payload,
                }).unwrap();
            } else {
                await createTestimonial(payload).unwrap();
            }
            setShowForm(false);
            setEditingId(null);
        } catch (err: any) {
            setErrorMsg(
                err?.data?.message ||
                    "Failed to save testimonial. Please check your inputs.",
            );
        }
    };

    const handleTogglePublish = async (item: LandingTestimonial) => {
        await updateTestimonial({
            id: item.id,
            body: { isPublished: !item.isPublished },
        });
    };

    const handleDelete = async (item: LandingTestimonial) => {
        if (
            !window.confirm(
                `Delete testimonial from ${item.authorName} (${item.restaurantName})?`,
            )
        ) {
            return;
        }
        await deleteTestimonial(item.id);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-foreground">
                        Landing Page Testimonials ({items.length})
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Add, edit, publish, or remove restaurant owner quotes
                        shown on the public landing page.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                >
                    <Plus className="size-3.5" />
                    <span>Add Testimonial</span>
                </button>
            </div>

            {showForm ? (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold">
                            {editingId ? "Edit Testimonial" : "New Testimonial"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {errorMsg ? (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
                            {errorMsg}
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Owner / Author Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.authorName}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        authorName: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Selamawit Bekele"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Role / Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.authorRole}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        authorRole: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Owner & General Manager"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Restaurant Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.restaurantName}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        restaurantName: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Bole Terrace Kitchen"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            Quote *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={form.quote}
                            onChange={e =>
                                setForm(f => ({
                                    ...f,
                                    quote: e.target.value,
                                }))
                            }
                            placeholder="What changed for their restaurant after switching to Restorch..."
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                Photo URL (optional)
                            </label>
                            <input
                                type="text"
                                value={form.photoUrl}
                                onChange={e =>
                                    setForm(f => ({
                                        ...f,
                                        photoUrl: e.target.value,
                                    }))
                                }
                                placeholder="https://... or /images/..."
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    Rating (1-5)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={form.rating}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            rating: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                                    Sort Order
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.sortOrder}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            sortOrder: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            isPublished: e.target.checked,
                                        }))
                                    }
                                    className="rounded border-border"
                                />
                                <span>Published</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            >
                                {editingId ? "Save Changes" : "Create"}
                            </button>
                        </div>
                    </div>
                </form>
            ) : null}

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-44 animate-pulse rounded-2xl border border-border bg-card"
                        />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-xs text-muted-foreground">
                    No testimonials yet. Click &ldquo;Add Testimonial&rdquo; to
                    publish your first restaurant owner quote.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => {
                        const photoSrc = item.photoUrl
                            ? filePublicUrl(item.photoUrl)
                            : null;
                        return (
                            <div
                                key={item.id}
                                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 text-orange-500">
                                            {Array.from({
                                                length: item.rating,
                                            }).map((_, idx) => (
                                                <Star
                                                    key={idx}
                                                    className="size-3.5 fill-current"
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                    item.isPublished
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {item.isPublished
                                                    ? "Published"
                                                    : "Hidden"}
                                            </span>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                #{item.sortOrder}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs sm:text-sm text-foreground leading-relaxed">
                                        &ldquo;{item.quote}&rdquo;
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-500/25 bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                                            {photoSrc ? (
                                                <img
                                                    src={photoSrc}
                                                    alt={item.authorName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                initials(item.authorName)
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-foreground">
                                                {item.authorName}
                                            </p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {item.authorRole} ·{" "}
                                                {item.restaurantName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTogglePublish(item)
                                            }
                                            title={
                                                item.isPublished
                                                    ? "Hide from landing page"
                                                    : "Publish to landing page"
                                            }
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            {item.isPublished ? (
                                                <EyeOff className="size-3.5" />
                                            ) : (
                                                <Eye className="size-3.5" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openEdit(item)}
                                            title="Edit"
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                            <Edit3 className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            title="Delete"
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

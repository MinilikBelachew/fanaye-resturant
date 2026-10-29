"use client";

import { useState } from "react";
import {
    CheckCircle2,
    Loader2,
    MessageSquarePlus,
    Send,
    Star,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { useSubmitWebsiteFeedbackMutation } from "@/context/services/feedbackApi";

export default function SiteFeedbackWidget({ slug }: { slug: string }) {
    const [submitFeedback, { isLoading }] = useSubmitWebsiteFeedbackMutation();
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function openModal() {
        setOpen(true);
        setSubmitted(false);
    }

    async function handleSubmit() {
        if (rating < 1) return;
        try {
            await submitFeedback({
                slug,
                body: {
                    rating,
                    comment: comment.trim() || undefined,
                    customerName: name.trim() || undefined,
                    customerPhone: phone.trim() || undefined,
                },
            }).unwrap();
            setSubmitted(true);
            toast.success(
                "Thank you for your feedback!",
                "Your rating has been shared with the restaurant.",
            );
        } catch {
            toast.error(
                "Could not send your feedback right now. Please try again.",
            );
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-amber-700 active:scale-95"
                aria-label="Leave feedback"
            >
                <Star className="size-4" />
                <span className="hidden sm:inline">Leave Feedback</span>
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm rounded-t-[32px] bg-white p-6 shadow-2xl sm:rounded-[32px] dark:bg-slate-900 dark:text-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-50">
                                <MessageSquarePlus className="size-4 text-amber-600 dark:text-amber-400" />
                                Share Your Feedback
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {submitted ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <CheckCircle2 className="size-7" />
                                </div>
                                <h4 className="mt-3 text-sm font-black text-slate-900 dark:text-slate-50">
                                    Thank you!
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Your feedback has been shared with the
                                    restaurant.
                                </p>
                                <Button
                                    onClick={() => setOpen(false)}
                                    className="mt-5 w-full rounded-xl bg-slate-900 text-xs font-bold text-white dark:bg-amber-500 dark:text-slate-950"
                                >
                                    Done
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-4">
                                <div className="text-center">
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        How would you rate us?
                                    </p>
                                    <div className="mt-2 flex items-center justify-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="p-0.5 transition-transform active:scale-90"
                                                aria-label={`${star} star`}
                                            >
                                                <Star
                                                    className={`size-8 ${
                                                        star <= rating
                                                            ? "fill-amber-500 text-amber-500"
                                                            : "text-slate-300 dark:text-slate-600"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Your name (optional)
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Selam"
                                        className="mt-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Phone (optional)
                                    </label>
                                    <Input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+251 …"
                                        className="mt-1 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Your comment (optional)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={e =>
                                            setComment(e.target.value)
                                        }
                                        rows={3}
                                        placeholder="Tell us what you loved or what we can improve…"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || rating < 1}
                                    className="w-full gap-2 rounded-2xl bg-amber-600 py-6 text-sm font-bold text-white hover:bg-amber-700 shadow-md disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                    <span>Submit Feedback</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </>
    );
}

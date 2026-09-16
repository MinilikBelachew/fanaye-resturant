"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function KpiStatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-4 min-h-[102px]"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="size-4 rounded-full" />
                    </div>
                    <Skeleton className="my-1.5 h-7 w-28" />
                    <Skeleton className="h-3 w-36" />
                </div>
            ))}
        </div>
    );
}

export function FloorGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {/* KPI stats bar */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-4"
                    >
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="mt-2 h-7 w-12" />
                    </div>
                ))}
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 rounded-[48px]" />
                <Skeleton className="h-9 w-24 rounded-[48px]" />
                <Skeleton className="h-9 w-20 rounded-[48px]" />
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-4 min-h-[140px]"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-6 w-20 rounded-md" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-2.5">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-4 w-14 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LiveFloorSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-4 min-h-[130px]"
                >
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="mt-4 space-y-1.5 border-t border-hairline/60 pt-2">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3.5 w-36" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero Bar */}
            <div className="rounded-[16px] border border-hairline bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-7 w-32 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3.5 w-44" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-28 rounded-[48px]" />
                        <Skeleton className="h-9 w-32 rounded-[48px]" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tickets list */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-[16px] border border-hairline bg-card p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-16 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-14" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Running Tab Summary */}
                <div className="rounded-[16px] border border-hairline bg-card p-5 space-y-4 h-fit">
                    <Skeleton className="h-5 w-32" />
                    <div className="space-y-2 border-y border-hairline/60 py-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-3.5 w-16" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3.5 w-14" />
                        </div>
                        <div className="flex justify-between font-semibold">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded-[48px]" />
                </div>
            </div>
        </div>
    );
}

export function StationQueueSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-7 w-40" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20 rounded-[12px]" />
                    <Skeleton className="h-9 w-20 rounded-[12px]" />
                </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-[16px] border border-hairline bg-card p-4 space-y-2"
                    >
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-10" />
                    </div>
                ))}
            </div>

            {/* Ticket Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-4 min-h-[160px]"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20 rounded-full" />
                                <Skeleton className="h-3.5 w-16" />
                            </div>
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-3">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-8 w-24 rounded-[48px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CashierBillsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col justify-between rounded-[16px] border border-hairline bg-card p-5 min-h-[170px]"
                >
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-7 w-28" />
                    </div>
                    <div className="mt-4 border-t border-hairline/60 pt-3">
                        <Skeleton className="h-9 w-full rounded-[48px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CashierPaymentsSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-hairline bg-card p-4"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-8 w-24 rounded-[48px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MenuCatalogSkeleton() {
    return (
        <div className="space-y-6">
            {/* Filter & search bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Skeleton className="h-10 w-72 rounded-[12px]" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                </div>
            </div>

            {/* Dish Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between overflow-hidden rounded-[16px] border border-hairline bg-card"
                    >
                        <Skeleton className="h-40 w-full rounded-none" />
                        <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-3.5 w-44" />
                            <div className="mt-3 flex items-center justify-between border-t border-hairline/60 pt-2.5">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-6 w-12 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StudioSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-3.5 w-80" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-[48px]" />
                    <Skeleton className="h-10 w-28 rounded-[48px]" />
                </div>
            </div>

            {/* 2-Column Studio Canvas */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left config form */}
                <div className="space-y-4 lg:col-span-7">
                    <div className="rounded-[16px] border border-hairline bg-card p-5 space-y-4">
                        <Skeleton className="h-5 w-36" />
                        <div className="space-y-3">
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    </div>
                    <div className="rounded-[16px] border border-hairline bg-card p-5 space-y-4">
                        <Skeleton className="h-5 w-40" />
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-16 w-full rounded-md" />
                            <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                    </div>
                </div>

                {/* Right phone / paper preview */}
                <div className="flex items-center justify-center rounded-[20px] border border-hairline bg-secondary/40 p-8 lg:col-span-5 min-h-[500px]">
                    <div className="w-[280px] h-[480px] rounded-[36px] border-4 border-hairline bg-card p-4 space-y-4">
                        <div className="mx-auto h-4 w-24 rounded-full bg-secondary" />
                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}

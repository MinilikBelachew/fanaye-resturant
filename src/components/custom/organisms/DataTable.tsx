"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    ChevronDown,
    ChevronsUpDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
    id: string;
    header: string;
    cell: (row: T) => ReactNode;
    sortValue?: (row: T) => string | number;
    hideable?: boolean;
    defaultHidden?: boolean;
    className?: string;
    headerClassName?: string;
}

export interface DataTablePagination {
    page: number;
    totalPages: number;
    total: number;
    limit?: number;
    onPageChange: (page: number) => void;
}

type SortState = { id: string; dir: "asc" | "desc" } | null;

export default function DataTable<T>({
    columns,
    data,
    rowKey,
    empty = "No rows to show.",
    className,
    searchPlaceholder = "Search...",
    searchText,
    searchQuery,
    onSearchChange,
    headerActions,
    pagination,
    serverSide = false,
    showColumnToggle = true,
}: {
    columns: DataTableColumn<T>[];
    data: T[];
    rowKey: (row: T) => string;
    empty?: ReactNode;
    className?: string;
    searchPlaceholder?: string | null;
    searchText?: (row: T) => string;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    headerActions?: ReactNode;
    pagination?: DataTablePagination;
    serverSide?: boolean;
    showColumnToggle?: boolean;
}) {
    const [internalQuery, setInternalQuery] = useState("");
    const isControlledSearch = searchQuery !== undefined;
    const query = isControlledSearch ? searchQuery : internalQuery;

    const [sort, setSort] = useState<SortState>(null);
    const [hidden, setHidden] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            columns
                .filter(column => column.defaultHidden)
                .map(column => [column.id, true]),
        ),
    );
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!columnsRef.current?.contains(event.target as Node)) {
                setColumnsOpen(false);
            }
        }
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    const visibleColumns = columns.filter(column => !hidden[column.id]);

    const rows = useMemo(() => {
        if (serverSide) return data;
        const needle = query.trim().toLowerCase();
        const filtered = needle
            ? data.filter(row => {
                  const text =
                      searchText?.(row) ??
                      columns
                          .map(column => String(column.sortValue?.(row) ?? ""))
                          .join(" ");
                  return text.toLowerCase().includes(needle);
              })
            : data;
        if (!sort) return filtered;
        const column = columns.find(entry => entry.id === sort.id);
        if (!column?.sortValue) return filtered;
        return [...filtered].sort((a, b) => {
            const left = column.sortValue!(a);
            const right = column.sortValue!(b);
            const compared =
                typeof left === "number" && typeof right === "number"
                    ? left - right
                    : String(left).localeCompare(String(right), undefined, {
                          numeric: true,
                          sensitivity: "base",
                      });
            return sort.dir === "asc" ? compared : -compared;
        });
    }, [columns, data, query, searchText, serverSide, sort]);

    function toggleSort(column: DataTableColumn<T>) {
        if (!column.sortValue) return;
        setSort(current => {
            if (current?.id !== column.id) return { id: column.id, dir: "asc" };
            if (current.dir === "asc") return { id: column.id, dir: "desc" };
            return null;
        });
    }

    function toggleColumn(id: string) {
        setHidden(current => {
            const nextHidden = !current[id];
            const next = { ...current, [id]: nextHidden };
            const stillVisible = columns.some(column => !next[column.id]);
            return stillVisible ? next : current;
        });
    }

    const handleSearchChange = (val: string) => {
        if (onSearchChange) {
            onSearchChange(val);
        } else {
            setInternalQuery(val);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    {searchPlaceholder ? (
                        <Input
                            value={query}
                            onChange={event =>
                                handleSearchChange(event.target.value)
                            }
                            placeholder={searchPlaceholder}
                            className="h-9 w-full max-w-xs rounded-md bg-card"
                            aria-label={searchPlaceholder}
                        />
                    ) : null}
                    {headerActions}
                </div>
                {showColumnToggle ? (
                    <div className="relative" ref={columnsRef}>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-md"
                            onClick={() => setColumnsOpen(open => !open)}
                        >
                            Columns
                            <ChevronDown className="size-4 opacity-60" />
                        </Button>
                        {columnsOpen ? (
                            <div className="absolute top-[calc(100%+8px)] right-0 z-40 w-52 rounded-md border border-hairline bg-card p-2 shadow-subtle">
                                {columns.map(column => {
                                    const hideable = column.hideable !== false;
                                    const checked = !hidden[column.id];
                                    return (
                                        <label
                                            key={column.id}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]",
                                                hideable
                                                    ? "cursor-pointer hover:bg-secondary"
                                                    : "cursor-not-allowed opacity-60",
                                            )}
                                        >
                                            <Checkbox
                                                checked={checked}
                                                disabled={!hideable}
                                                onCheckedChange={() => {
                                                    if (hideable) {
                                                        toggleColumn(column.id);
                                                    }
                                                }}
                                            />
                                            {column.header}
                                        </label>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="overflow-hidden rounded-[12px] border border-hairline bg-card">
                <Table>
                    <TableHeader className="bg-muted [&_tr]:hover:bg-muted">
                        <TableRow className="border-hairline hover:bg-muted">
                            {visibleColumns.map(column => {
                                const sortable = Boolean(column.sortValue);
                                const active = sort?.id === column.id;
                                return (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            "h-12 text-[13px] font-medium tracking-normal text-slate-gray normal-case",
                                            column.headerClassName,
                                        )}
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 hover:text-foreground"
                                                onClick={() =>
                                                    toggleSort(column)
                                                }
                                            >
                                                {column.header}
                                                {active &&
                                                sort?.dir === "asc" ? (
                                                    <ChevronUp className="size-3.5" />
                                                ) : active ? (
                                                    <ChevronDown className="size-3.5" />
                                                ) : (
                                                    <ChevronsUpDown className="size-3.5 opacity-50" />
                                                )}
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={Math.max(visibleColumns.length, 1)}
                                    className="h-28 text-center text-slate-gray"
                                >
                                    {empty}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map(row => (
                                <TableRow key={rowKey(row)}>
                                    {visibleColumns.map(column => (
                                        <TableCell
                                            key={column.id}
                                            className={cn(
                                                "py-4",
                                                column.className,
                                            )}
                                        >
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-between px-1 py-2 text-[13px] text-slate-gray">
                    <span>
                        Showing page <strong>{pagination.page}</strong> of{" "}
                        <strong>{pagination.totalPages}</strong> (
                        {pagination.total} total)
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() =>
                                pagination.onPageChange(pagination.page - 1)
                            }
                            className="h-8 gap-1 px-2.5 rounded-lg text-[12px]"
                        >
                            <ChevronLeft className="size-3.5" />
                            <span>Previous</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() =>
                                pagination.onPageChange(pagination.page + 1)
                            }
                            className="h-8 gap-1 px-2.5 rounded-lg text-[12px]"
                        >
                            <span>Next</span>
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

"use client";

import type { ReactNode } from "react";
import type {
    FloorLocation,
    FloorTable,
} from "@/domains/floor/domain/floorApi";
import { groupFloorTables } from "@/domains/floor/application/groupFloor";
import { useTranslations } from "next-intl";

export default function FloorLocationSections({
    tables,
    locations,
    renderTable,
}: {
    tables: FloorTable[];
    locations: FloorLocation[];
    renderTable: (table: FloorTable) => ReactNode;
}) {
    const t = useTranslations("managerTables");
    const groups = groupFloorTables(tables, locations);

    return (
        <div className="space-y-6">
            {groups.map(group => (
                <section key={group.location.id}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <h2 className="text-[15px] font-semibold">
                            {group.location.name}
                        </h2>
                        <span className="text-[12px] text-slate-gray">
                            {group.tables.length === 1
                                ? t("tableOne", { count: group.tables.length })
                                : t("tableMany", {
                                      count: group.tables.length,
                                  })}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {group.tables.map(table => renderTable(table))}
                    </div>
                </section>
            ))}
        </div>
    );
}

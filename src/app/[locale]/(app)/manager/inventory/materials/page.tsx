"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryBoard from "@/domains/inventory/ui/InventoryBoard";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "የዕቃ ክምችት" : "Inventory"}
                title={isAm ? "ተመላሽ የእቃ ቁሳቁሶች" : "Returnable Materials"}
                description={
                    isAm
                        ? "ወደ ውጭ የተላኩ ትሪዎች፣ ቴርሞሶች እና እቃዎች ክትትል እና ርክክብ።"
                        : "Track returnable tableware, trays, and thermoses sent outside the restaurant."
                }
            />
            <InventoryBoard initialTab="materials" />
        </DashboardFrame>
    );
}

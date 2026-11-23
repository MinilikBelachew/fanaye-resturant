"use client";

import { useLocale } from "next-intl";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import BakeryNewSale from "@/domains/payments/ui/BakeryNewSale";

export default function Page() {
    const isAm = useLocale() === "am";

    return (
        <DashboardFrame>
            <PageHeader
                compact
                eyebrow={isAm ? "የዳቦ መሸጫ" : "Bakery"}
                title={isAm ? "የዳቦ እና ኬክ መሸጫ (POS)" : "Bakery POS"}
                description={
                    isAm
                        ? "ምግብ ለመጨመር ፎቶውን ይንኩ። + / − ወይም +5 ይጠቀሙ፣ ከዚያ ሂሳቡን ያዘጋጁ።"
                        : "Tap a photo to add. Use + / − or +5, then generate the bill."
                }
            />
            <BakeryNewSale />
        </DashboardFrame>
    );
}

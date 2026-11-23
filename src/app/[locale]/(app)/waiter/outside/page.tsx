"use client";

import { useLocale } from "next-intl";
import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function WaiterOutsideOrdersPage() {
    const isAm = useLocale() === "am";
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title={
                    isAm
                        ? "የውጭ እና ከሬስቶራንት ውጪ ትዕዛዞች"
                        : "Outside & Off-Site Orders"
                }
                subtitle={
                    isAm
                        ? "ለአቅራቢያ ህንጻዎች፣ ቢሮዎችና ካፌዎች ትዕዛዞችን ይክፈቱ፣ በፈረቃዎ ስር ያሉ ተመላሽ ቁሳቁሶችን ይከታተሉ።"
                        : "Open orders for adjacent buildings, offices, cafes, and track returnable tableware under your shift."
                }
            />
        </div>
    );
}

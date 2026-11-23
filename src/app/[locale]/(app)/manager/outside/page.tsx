"use client";

import { useLocale } from "next-intl";
import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function ManagerOutsideOrdersPage() {
    const isAm = useLocale() === "am";
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title={
                    isAm
                        ? "የቅርንጫፉ የውጭ ትዕዛዞች እና እቃዎች"
                        : "Branch Outside Orders & Materials"
                }
                subtitle={
                    isAm
                        ? "ከሬስቶራንት ውጭ ትዕዛዞችን፣ የአስተላላኪ ርክክብን እና ወደ ማብሰያ ቤት የሚመለሱ እቃዎችን በቅርንጫፉ ደረጃ ይቆጣጠሩ።"
                        : "Monitor off-premises orders, delivery staff custody, and kitchen returns across the branch."
                }
            />
        </div>
    );
}

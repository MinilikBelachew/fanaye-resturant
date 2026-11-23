"use client";

import { useLocale } from "next-intl";
import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function OwnerOutsideOrdersPage() {
    const isAm = useLocale() === "am";
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title={
                    isAm
                        ? "የውጭ ትዕዛዞች እና የእቃ ቁሳቁስ ክትትል"
                        : "Outside Orders & Tableware Tracking"
                }
                subtitle={
                    isAm
                        ? "የውጭ የምግብ ዝግጅት አገልግሎት፣ የአካባቢው ቢሮዎች ትዕዛዞች እና የእቃ ብክነት መከላከያ አጠቃላይ ቁጥጥር።"
                        : "High-level visibility into external catering, neighboring office orders, and tableware loss prevention."
                }
            />
        </div>
    );
}

import { Badge } from "@/components/ui/badge";
import KpiCard from "@/components/custom/organisms/KpiCard";

export default function DailyClosePanel() {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="House sales" value="ETB 38,720" />
                <KpiCard label="Cash drop" value="ETB 22,480" />
                <KpiCard
                    label="Verified transfer"
                    value="ETB 16,240"
                    tone="brand"
                />
            </div>
            <article className="rounded-[16px] border border-hairline bg-white p-6 shadow-subtle">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">7 Sep 2026</h2>
                    <Badge variant="warning">Awaiting lock</Badge>
                </div>
                <ul className="mt-4 space-y-2 text-[14px]">
                    <li className="flex justify-between">
                        <span>Karim Tesfaye · 18 orders</span>
                        <span>ETB 12,400</span>
                    </li>
                    <li className="flex justify-between text-slate-gray">
                        <span>Cash taken</span>
                        <span>ETB 8,000</span>
                    </li>
                    <li className="flex justify-between text-slate-gray">
                        <span>Verified transfer</span>
                        <span>ETB 4,400</span>
                    </li>
                </ul>
            </article>
        </>
    );
}

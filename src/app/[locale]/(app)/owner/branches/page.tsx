import { Badge } from "@/components/ui/badge";
import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { DISH_IMAGES } from "@/lib/media";

const BRANCHES = [
    {
        name: "Fanaye · Bole",
        status: "Open",
        sales: "ETB 38,720",
        image: DISH_IMAGES.burger,
    },
    {
        name: "Fanaye · Piassa (planned)",
        status: "Setup",
        sales: "—",
        image: DISH_IMAGES.pizza,
    },
];

export default function BranchesPage() {
    return (
        <DashboardFrame>
            <PageHeader
                eyebrow="Business"
                title="Branches"
                description="This demo runs one live branch. A second location is shown as planned."
            />
            <div className="grid gap-4 md:grid-cols-2">
                {BRANCHES.map(branch => (
                    <article
                        key={branch.name}
                        className="overflow-hidden rounded-[16px] border border-hairline bg-white shadow-subtle"
                    >
                        <div className="h-44 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={branch.image}
                                alt=""
                                className="size-full object-cover"
                            />
                        </div>
                        <div className="flex items-center justify-between p-5">
                            <div>
                                <h2 className="font-semibold">{branch.name}</h2>
                                <p className="text-[13px] text-slate-gray">
                                    {branch.sales}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    branch.status === "Open"
                                        ? "success"
                                        : "secondary"
                                }
                            >
                                {branch.status}
                            </Badge>
                        </div>
                    </article>
                ))}
            </div>
        </DashboardFrame>
    );
}

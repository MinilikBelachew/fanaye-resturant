"use client";

import DashboardFrame from "@/components/custom/organisms/DashboardFrame";
import PageHeader from "@/components/custom/organisms/PageHeader";
import InventoryBoard from "@/domains/inventory/ui/InventoryBoard";

export default function ManagerMaterialsPage() {
    return (
        <DashboardFrame>
            <PageHeader title="Returnable Materials" compact />
            <InventoryBoard initialTab="materials" />
        </DashboardFrame>
    );
}

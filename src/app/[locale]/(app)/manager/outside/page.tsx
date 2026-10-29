import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function ManagerOutsideOrdersPage() {
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title="Branch Outside Orders & Materials"
                subtitle="Monitor off-premises orders, delivery staff custody, and kitchen returns across the branch."
            />
        </div>
    );
}

import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function OwnerOutsideOrdersPage() {
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title="Outside Orders & Tableware Tracking"
                subtitle="High-level visibility into external catering, neighboring office orders, and tableware loss prevention."
            />
        </div>
    );
}

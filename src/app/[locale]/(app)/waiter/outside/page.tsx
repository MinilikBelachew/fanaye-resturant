import OutsideOrdersBoard from "@/domains/outside-orders/ui/OutsideOrdersBoard";

export default function WaiterOutsideOrdersPage() {
    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <OutsideOrdersBoard
                title="Outside & Off-Site Orders"
                subtitle="Open orders for adjacent buildings, offices, cafes, and track returnable tableware under your shift."
            />
        </div>
    );
}

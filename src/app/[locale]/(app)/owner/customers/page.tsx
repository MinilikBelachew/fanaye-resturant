"use client";

import CustomerBiometricsManagement from "@/domains/biometrics/ui/CustomerBiometricsManagement";

export default function OwnerCustomersPage() {
    return <CustomerBiometricsManagement isOwnerView={true} />;
}

import { RestorchLoader } from "@/components/common/RestorchLoader";

export default function RootLoading() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <RestorchLoader
                size="lg"
                label="Restorch"
                subLabel="Connecting to operating system..."
            />
        </div>
    );
}

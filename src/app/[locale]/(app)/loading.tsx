import { RestorchLoader } from "@/components/common/RestorchLoader";

export default function AppLoading() {
    return (
        <div className="flex min-h-[70vh] w-full flex-1 items-center justify-center p-6">
            <RestorchLoader size="md" label="Loading..." />
        </div>
    );
}

"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import {
    Users,
    Search,
    Plus,
    Crown,
    Sparkles,
    Camera,
    Calendar,
    Phone,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    UserCheck,
    Star,
    Video,
    VideoOff,
    Zap,
    Radio,
    Upload,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    Tag,
    Clock,
    Check,
    Building2,
    LayoutGrid,
    List,
} from "lucide-react";
import {
    useListCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useScanCustomerMutation,
    CustomerBiometricProfile,
    CustomerVipTier,
} from "@/context/services/biometricsApi";
import { useListBranchesQuery } from "@/context/services/branchesApi";
import { useAppSelector } from "@/context/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import DataTable, {
    type DataTableColumn,
} from "@/components/custom/organisms/DataTable";

// Synthesizes pleasant acoustic chime on face detection without external audio files
function playRecognitionChime(isVip: boolean) {
    try {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const now = ctx.currentTime;
        if (isVip) {
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.setValueAtTime(880, now + 0.12); // A5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
            osc.start(now);
            osc.stop(now + 0.38);
        } else {
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch {
        // Ignore audio context block if user has not interacted with page
    }
}

// Computes VIP loyalty perks, discount rates, and progression towards next tier
export function getVipPerks(tier: CustomerVipTier, totalVisits: number) {
    if (tier === "VVIP" || totalVisits >= 15) {
        return {
            tierLabel: "VVIP Executive",
            discountLabel: "15% VIP Discount",
            discountPercent: 15,
            badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
            nextTierText: "Top Tier VIP Reached 👑",
            progressPercent: 100,
            highlightText: "Highest hospitality & table priority",
        };
    }
    if (tier === "VIP" || totalVisits >= 5) {
        const remaining = Math.max(0, 15 - totalVisits);
        return {
            tierLabel: "VIP Member",
            discountLabel: "10% VIP Discount",
            discountPercent: 10,
            badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
            nextTierText: `${remaining} more visit${remaining === 1 ? "" : "s"} to VVIP (15% off)`,
            progressPercent: Math.min(
                100,
                Math.round(((totalVisits - 5) / 10) * 100),
            ),
            highlightText: "Priority seating & 10% discount",
        };
    }
    const remaining = Math.max(0, 5 - totalVisits);
    return {
        tierLabel: "Regular Guest",
        discountLabel: "Standard Menu Rates",
        discountPercent: 0,
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        nextTierText: `${remaining} more visit${remaining === 1 ? "" : "s"} to VIP (10% off)`,
        progressPercent: Math.min(100, Math.round((totalVisits / 5) * 100)),
        highlightText: "Accumulating visit frequency",
    };
}

interface CustomerBiometricsManagementProps {
    isOwnerView?: boolean;
}

export default function CustomerBiometricsManagement({
    isOwnerView = false,
}: CustomerBiometricsManagementProps) {
    const session = useAppSelector(state => state.identity.session);
    const currentBranchId = session?.branchId;
    const currentTenantId = session?.tenantId;

    // View mode: Cards vs DataTable
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState<string>("ALL");
    const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
        isOwnerView ? "ALL" : currentBranchId || "ALL",
    );
    const [page, setPage] = useState(1);

    // Live Camera Scanner State
    const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
    const [autoScanEnabled, setAutoScanEnabled] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [liveScanResult, setLiveScanResult] = useState<any>(null);
    const [scanPulse, setScanPulse] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [lastActivityTime, setLastActivityTime] = useState<string | null>(
        null,
    );

    const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
    const [createStream, setCreateStream] = useState<MediaStream | null>(null);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isTestScanOpen, setIsTestScanOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerBiometricProfile | null>(null);

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editTier, setEditTier] = useState<CustomerVipTier>("REGULAR");

    // Create form state
    const [createName, setCreateName] = useState("");
    const [createPhone, setCreatePhone] = useState("");
    const [createNotes, setCreateNotes] = useState("");
    const [createTier, setCreateTier] = useState<CustomerVipTier>("REGULAR");
    const [createPhoto, setCreatePhoto] = useState<File | null>(null);
    const [createPhotoPreview, setCreatePhotoPreview] = useState<string | null>(
        null,
    );
    const [isCreateCameraActive, setIsCreateCameraActive] = useState(false);

    // Test scan state
    const [testPhoto, setTestPhoto] = useState<File | null>(null);
    const [testPhotoPreview, setTestPhotoPreview] = useState<string | null>(
        null,
    );
    const [testScanResult, setTestScanResult] = useState<any>(null);

    // Video and Canvas Refs
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const liveCanvasRef = useRef<HTMLCanvasElement>(null);
    const createVideoRef = useRef<HTMLVideoElement>(null);
    const createCanvasRef = useRef<HTMLCanvasElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const testFileInputRef = useRef<HTMLInputElement>(null);

    const liveStreamRef = useRef<MediaStream | null>(null);
    const createStreamRef = useRef<MediaStream | null>(null);

    // Branches list for Owner dropdown
    const { data: branchesData } = useListBranchesQuery();
    const branches = branchesData?.data || [];

    // Queries & Mutations
    const { data, isLoading, refetch, isFetching } = useListCustomersQuery({
        search: search.trim() || undefined,
        vipTier:
            tierFilter !== "ALL" ? (tierFilter as CustomerVipTier) : undefined,
        branchId:
            selectedBranchFilter !== "ALL" ? selectedBranchFilter : undefined,
        page,
        limit: 50,
    });

    const [updateCustomer, { isLoading: isUpdating }] =
        useUpdateCustomerMutation();
    const [createCustomer, { isLoading: isCreating }] =
        useCreateCustomerMutation();
    const [deleteCustomer, { isLoading: isDeleting }] =
        useDeleteCustomerMutation();
    const [scanCustomer, { isLoading: isScanning }] = useScanCustomerMutation();

    // Attach live camera stream once video is mounted
    useEffect(() => {
        if (liveVideoRef.current && liveStream) {
            liveVideoRef.current.srcObject = liveStream;
            liveVideoRef.current.play().catch(err => {
                console.warn("Live video auto-play:", err);
            });
        }
    }, [liveStream, isLiveCameraActive]);

    useEffect(() => {
        if (createVideoRef.current && createStream) {
            createVideoRef.current.srcObject = createStream;
            createVideoRef.current.play().catch(err => {
                console.warn("Create video auto-play:", err);
            });
        }
    }, [createStream, isCreateCameraActive]);

    // Enumerate attached cameras
    const enumerateCameras = useCallback(async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === "videoinput");
            setVideoDevices(videoInputs);
            if (videoInputs.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoInputs[0].deviceId);
            }
        } catch {
            // ignore
        }
    }, [selectedDeviceId]);

    // Start live camera stream
    const startLiveCamera = async (deviceId?: string) => {
        try {
            setCameraError(null);
            if (liveStream) {
                liveStream.getTracks().forEach(track => track.stop());
            }
            if (liveStreamRef.current) {
                liveStreamRef.current
                    .getTracks()
                    .forEach(track => track.stop());
            }

            const targetId = deviceId || selectedDeviceId;
            const constraints: MediaStreamConstraints = {
                video: targetId
                    ? {
                          deviceId: { exact: targetId },
                          width: { ideal: 1920, min: 1280 },
                          height: { ideal: 1080, min: 720 },
                      }
                    : {
                          facingMode: "user",
                          width: { ideal: 1920, min: 1280 },
                          height: { ideal: 1080, min: 720 },
                      },
                audio: false,
            };

            const stream =
                await navigator.mediaDevices.getUserMedia(constraints);
            liveStreamRef.current = stream;
            setLiveStream(stream);
            setIsLiveCameraActive(true);
            await enumerateCameras();
        } catch (err: any) {
            setCameraError(
                err.name === "NotAllowedError"
                    ? "Camera permission denied. Please allow camera access in browser settings."
                    : `Could not access camera: ${err.message}`,
            );
        }
    };

    const stopLiveCamera = () => {
        if (liveStream) {
            liveStream.getTracks().forEach(track => track.stop());
        }
        if (liveStreamRef.current) {
            liveStreamRef.current.getTracks().forEach(track => track.stop());
            liveStreamRef.current = null;
        }
        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }
        setLiveStream(null);
        setIsLiveCameraActive(false);
        setLiveScanResult(null);
    };

    const handleDeviceChange = (newDeviceId: string) => {
        setSelectedDeviceId(newDeviceId);
        if (isLiveCameraActive) {
            startLiveCamera(newDeviceId);
        }
    };

    // Capture single frame from live video and invoke matching engine
    const captureLiveSnapshot = useCallback(async () => {
        const video = liveVideoRef.current;
        const canvas = liveCanvasRef.current;
        if (!video || !canvas || video.readyState < 2 || isScanning) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            async blob => {
                if (!blob) return;
                setScanPulse(true);
                setTimeout(() => setScanPulse(false), 500);

                try {
                    const file = new File([blob], "camera_frame.jpg", {
                        type: "image/jpeg",
                    });
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append(
                        "cameraLocation",
                        isOwnerView
                            ? "Executive / Central Camera"
                            : "Entrance Camera Station",
                    );
                    if (currentBranchId)
                        formData.append("branchId", currentBranchId);
                    if (currentTenantId)
                        formData.append("tenantId", currentTenantId);

                    const res = await scanCustomer(formData).unwrap();
                    setLiveScanResult(res);

                    if (res?.matched && res?.status === "RETURNING") {
                        setLastActivityTime(new Date().toLocaleTimeString());
                        if (soundEnabled) {
                            playRecognitionChime(
                                res.customer?.vipTier === "VIP" ||
                                    res.customer?.vipTier === "VVIP",
                            );
                        }
                        refetch();
                    } else if (res?.matched && res?.status === "NEW") {
                        setLastActivityTime(new Date().toLocaleTimeString());
                        if (soundEnabled) {
                            playRecognitionChime(false);
                        }
                        refetch();
                    }
                } catch (err: any) {
                    setLiveScanResult({
                        error: true,
                        message:
                            err?.data?.message || err?.message || "Scan failed",
                    });
                }
            },
            "image/jpeg",
            0.85,
        );
    }, [
        isScanning,
        scanCustomer,
        refetch,
        soundEnabled,
        currentBranchId,
        currentTenantId,
        isOwnerView,
    ]);

    // Auto-scan interval (runs every 2.5s)
    useEffect(() => {
        if (!isLiveCameraActive || !autoScanEnabled) return;

        const timer = setInterval(() => {
            captureLiveSnapshot();
        }, 2500);

        return () => clearInterval(timer);
    }, [isLiveCameraActive, autoScanEnabled, captureLiveSnapshot]);

    // Clean up streams on unmount
    useEffect(() => {
        return () => {
            stopLiveCamera();
            if (createStreamRef.current) {
                createStreamRef.current
                    .getTracks()
                    .forEach(track => track.stop());
            }
        };
    }, []);

    const startCreateCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 480, height: 480, facingMode: "user" },
                audio: false,
            });
            createStreamRef.current = stream;
            setCreateStream(stream);
            setIsCreateCameraActive(true);
        } catch (err: any) {
            alert(`Could not open camera: ${err.message}`);
        }
    };

    const stopCreateCamera = () => {
        if (createStream) {
            createStream.getTracks().forEach(t => t.stop());
        }
        if (createStreamRef.current) {
            createStreamRef.current.getTracks().forEach(t => t.stop());
            createStreamRef.current = null;
        }
        if (createVideoRef.current) {
            createVideoRef.current.srcObject = null;
        }
        setCreateStream(null);
        setIsCreateCameraActive(false);
    };

    const takeCreateSnapshot = () => {
        const video = createVideoRef.current;
        const canvas = createCanvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
            blob => {
                if (!blob) return;
                const file = new File([blob], "customer_portrait.jpg", {
                    type: "image/jpeg",
                });
                setCreatePhoto(file);
                setCreatePhotoPreview(URL.createObjectURL(blob));
                stopCreateCamera();
            },
            "image/jpeg",
            0.9,
        );
    };

    const handleOpenEdit = (c: CustomerBiometricProfile) => {
        setSelectedCustomer(c);
        setEditName(c.displayName || "");
        setEditPhone(c.phone || "");
        setEditEmail(c.email || "");
        setEditNotes(c.notes || "");
        setEditTier(c.vipTier || "REGULAR");
        setIsEditOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            await updateCustomer({
                id: selectedCustomer.id,
                body: {
                    displayName: editName.trim() || undefined,
                    phone: editPhone.trim() || undefined,
                    email: editEmail.trim() || undefined,
                    notes: editNotes.trim() || undefined,
                    vipTier: editTier,
                },
            }).unwrap();
            setIsEditOpen(false);
            setSelectedCustomer(null);
            refetch();
        } catch (err: any) {
            alert(
                `Failed to update customer: ${err?.data?.message || err.message}`,
            );
        }
    };

    const resetCreateForm = () => {
        setCreateName("");
        setCreatePhone("");
        setCreateNotes("");
        setCreateTier("REGULAR");
        setCreatePhoto(null);
        setCreatePhotoPreview(null);
        stopCreateCamera();
    };

    const handleSaveCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createPhoto) {
            alert("Please take a portrait snapshot or select an image file.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", createPhoto);
            if (createName.trim())
                formData.append("displayName", createName.trim());
            if (createPhone.trim())
                formData.append("phone", createPhone.trim());
            if (createNotes.trim())
                formData.append("notes", createNotes.trim());
            formData.append("vipTier", createTier);
            if (currentBranchId) formData.append("branchId", currentBranchId);
            if (currentTenantId) formData.append("tenantId", currentTenantId);

            await createCustomer(formData).unwrap();
            setIsCreateOpen(false);
            resetCreateForm();
            refetch();
        } catch (err: any) {
            alert(
                `Failed to enroll customer: ${err?.data?.message || err.message}`,
            );
        }
    };

    const handleRunTestScan = async () => {
        if (!testPhoto) return;
        try {
            const formData = new FormData();
            formData.append("file", testPhoto);
            formData.append(
                "cameraLocation",
                isOwnerView ? "Executive Test Scan" : "Manager Photo Test",
            );
            if (currentBranchId) formData.append("branchId", currentBranchId);
            if (currentTenantId) formData.append("tenantId", currentTenantId);

            const res = await scanCustomer(formData).unwrap();
            setTestScanResult(res);
            refetch();
        } catch (err: any) {
            setTestScanResult({
                error: true,
                message:
                    err?.data?.message ||
                    err.message ||
                    "Failed to process photo",
            });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (
            confirm(
                `Are you sure you want to remove customer biometric profile "${name}"?`,
            )
        ) {
            try {
                await deleteCustomer(id).unwrap();
                refetch();
            } catch (err: any) {
                alert(`Failed to delete: ${err?.data?.message || err.message}`);
            }
        }
    };

    const stats = data?.stats || {
        totalEnrolledCustomers: 0,
        totalVisitsAccumulated: 0,
        vipCount: 0,
        regularCount: 0,
    };

    const activePerks = liveScanResult?.customer
        ? getVipPerks(
              liveScanResult.customer.vipTier,
              liveScanResult.customer.totalVisits,
          )
        : null;

    // -------------------------------------------------------------
    // DataTable Columns Definition
    // -------------------------------------------------------------
    const tableColumns = useMemo<
        DataTableColumn<CustomerBiometricProfile>[]
    >(() => {
        return [
            {
                id: "photo",
                header: "Photo",
                className: "w-14",
                cell: c => (
                    <div className="size-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                        {c.avatarUrl ? (
                            <img
                                src={c.avatarUrl}
                                alt={c.displayName || c.customerCode}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserCheck className="size-5 text-slate-400" />
                        )}
                    </div>
                ),
            },
            {
                id: "identity",
                header: "Guest Name & Code",
                sortValue: c => c.displayName || c.customerCode,
                cell: c => (
                    <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {c.displayName || (
                                <span
                                    onClick={() => handleOpenEdit(c)}
                                    className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer italic text-xs font-normal"
                                >
                                    Unnamed Guest (Click to name)
                                </span>
                            )}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                            #{c.customerCode}
                        </div>
                    </div>
                ),
            },
            {
                id: "vipTier",
                header: "VIP Tier & Discount",
                sortValue: c => c.vipTier,
                cell: c => {
                    const perks = getVipPerks(c.vipTier, c.totalVisits);
                    return (
                        <div className="space-y-0.5">
                            <Badge
                                className={`${perks.badgeColor} text-[10px] gap-1 font-semibold`}
                            >
                                {c.vipTier === "VVIP" && (
                                    <Sparkles className="size-3" />
                                )}
                                {c.vipTier === "VIP" && (
                                    <Crown className="size-3" />
                                )}
                                {perks.tierLabel}
                            </Badge>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Tag className="size-3" />
                                {perks.discountLabel}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "visits",
                header: "Visits & Loyalty",
                sortValue: c => c.totalVisits,
                cell: c => {
                    const perks = getVipPerks(c.vipTier, c.totalVisits);
                    return (
                        <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                                <span>
                                    {c.totalVisits}{" "}
                                    {c.totalVisits === 1 ? "Visit" : "Visits"}
                                </span>
                                <span className="text-[10px] font-normal text-slate-400">
                                    {perks.progressPercent}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-1.5 rounded-full"
                                    style={{
                                        width: `${perks.progressPercent}%`,
                                    }}
                                />
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                                {perks.nextTierText}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "branch",
                header: "Enrolled Branch",
                cell: c => (
                    <Badge
                        variant="outline"
                        className="text-xs font-normal border-slate-300 dark:border-slate-700"
                    >
                        <Building2 className="size-3 mr-1 text-slate-400" />
                        {c.branch?.name || "Kera"}
                    </Badge>
                ),
            },
            {
                id: "phone",
                header: "Phone",
                cell: c => (
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                        {c.phone || (
                            <span className="text-slate-400 italic">
                                No phone
                            </span>
                        )}
                    </span>
                ),
            },
            {
                id: "notes",
                header: "Dining Preferences",
                cell: c => (
                    <div className="max-w-xs text-xs text-amber-700 dark:text-amber-300/90 truncate">
                        {c.notes || (
                            <span className="text-slate-400 italic font-normal">
                                None recorded
                            </span>
                        )}
                    </div>
                ),
            },
            {
                id: "lastVisitAt",
                header: "Last Seen",
                sortValue: c => new Date(c.lastVisitAt).getTime(),
                cell: c => (
                    <span className="text-xs text-slate-400">
                        {new Date(c.lastVisitAt).toLocaleDateString()}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                className: "w-20 text-right",
                cell: c => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(c)}
                            className="size-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            title="Edit Profile"
                        >
                            <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                handleDelete(
                                    c.id,
                                    c.displayName || c.customerCode,
                                )
                            }
                            className="size-7 text-slate-400 hover:text-rose-500"
                            title="Delete Profile"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    </div>
                ),
            },
        ];
    }, [handleOpenEdit, handleDelete]);

    return (
        <div
            className={`space-y-6 max-w-7xl mx-auto ${isTheaterMode ? "p-2 sm:p-4" : "p-4 sm:p-6"}`}
        >
            {/* Top Header & Unified Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                            <Users className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                Customer Intelligence &amp; Face Recognition
                                {isOwnerView && (
                                    <Badge className="bg-purple-600 text-white text-[10px] font-mono">
                                        Owner Central
                                    </Badge>
                                )}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {isOwnerView
                                    ? "Brand-wide customer recognition across all restaurant branches, VIP loyalty, and executive intelligence."
                                    : "Real-time entrance camera recognition, automatic VIP discounts, visit debouncing, and hospitality preferences."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Main Camera Toggle Button */}
                    <Button
                        variant={isLiveCameraActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                            if (isLiveCameraActive) {
                                stopLiveCamera();
                            } else {
                                startLiveCamera();
                            }
                        }}
                        className={`gap-2 text-white font-medium shadow transition-all ${
                            isLiveCameraActive
                                ? "bg-rose-600 hover:bg-rose-700"
                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20"
                        }`}
                    >
                        {isLiveCameraActive ? (
                            <>
                                <VideoOff className="size-4" />
                                Stop Live Camera
                            </>
                        ) : (
                            <>
                                <Video className="size-4" />
                                Start Live Camera
                            </>
                        )}
                    </Button>

                    {/* Test Scan with File */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setTestPhoto(null);
                            setTestPhotoPreview(null);
                            setTestScanResult(null);
                            setIsTestScanOpen(true);
                        }}
                        className="gap-2 border-slate-300 dark:border-slate-700 text-xs"
                    >
                        <Upload className="size-3.5 text-blue-500" />
                        Upload Test Photo
                    </Button>

                    {/* Enroll Customer */}
                    <Button
                        size="sm"
                        onClick={() => {
                            resetCreateForm();
                            setIsCreateOpen(true);
                        }}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                        <Plus className="size-3.5" />
                        Enroll Customer
                    </Button>

                    {/* Refresh */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        title="Refresh"
                        className="size-8"
                    >
                        <RefreshCw
                            className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
            </div>

            {/* LIVE CAMERA SCANNER STATION (Expands when camera is active) */}
            {isLiveCameraActive && (
                <Card
                    className={`border-2 border-emerald-500/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isTheaterMode ? "ring-4 ring-emerald-500/20" : ""}`}
                >
                    <div className="p-4 sm:p-5">
                        {/* HUD Header Toolbar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex size-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-3 bg-emerald-500"></span>
                                </span>
                                <div>
                                    <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                                        Live Entrance Camera Feed
                                        <Badge
                                            variant="outline"
                                            className="border-emerald-500 text-emerald-400 font-mono text-[10px]"
                                        >
                                            YuNet + MiniFASNet + SFace
                                        </Badge>
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Continuous facial detection, human
                                        liveness verification, and VIP
                                        recognition.
                                    </p>
                                </div>
                            </div>

                            {/* HUD Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                {videoDevices.length > 1 && (
                                    <Select
                                        value={selectedDeviceId}
                                        onValueChange={handleDeviceChange}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 w-36">
                                            <SelectValue placeholder="Camera" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                            {videoDevices.map((d, idx) => (
                                                <SelectItem
                                                    key={d.deviceId || idx}
                                                    value={d.deviceId}
                                                    className="text-xs"
                                                >
                                                    {d.label ||
                                                        `Camera ${idx + 1}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setSoundEnabled(!soundEnabled)
                                    }
                                    title={
                                        soundEnabled
                                            ? "Audio Chime Enabled"
                                            : "Audio Muted"
                                    }
                                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    {soundEnabled ? (
                                        <Volume2 className="size-4 text-emerald-400" />
                                    ) : (
                                        <VolumeX className="size-4 text-slate-500" />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setIsTheaterMode(!isTheaterMode)
                                    }
                                    title={
                                        isTheaterMode
                                            ? "Exit Theater Mode"
                                            : "Expand Theater Mode"
                                    }
                                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    {isTheaterMode ? (
                                        <Minimize2 className="size-4" />
                                    ) : (
                                        <Maximize2 className="size-4" />
                                    )}
                                </Button>

                                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-slate-300 hover:text-white px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={autoScanEnabled}
                                        onChange={e =>
                                            setAutoScanEnabled(e.target.checked)
                                        }
                                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 size-3.5"
                                    />
                                    <span>Auto-Scan (2.5s)</span>
                                </label>

                                {/* Instant Snap Button */}
                                <Button
                                    size="sm"
                                    onClick={captureLiveSnapshot}
                                    disabled={isScanning}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 h-8 px-3 shadow"
                                >
                                    <Zap className="size-3.5 fill-current" />
                                    {isScanning
                                        ? "Scanning..."
                                        : "Instant Snap"}
                                </Button>
                            </div>
                        </div>

                        {/* Split View: Video Stream + Live VIP Intelligence Card */}
                        <div
                            className={`grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-stretch ${isTheaterMode ? "min-h-[480px]" : ""}`}
                        >
                            {/* Video Stream Container */}
                            <div className="lg:col-span-7 relative rounded-xl overflow-hidden bg-black aspect-video max-h-[420px] border border-slate-800 flex items-center justify-center shadow-inner">
                                <video
                                    ref={liveVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    onLoadedMetadata={() => {
                                        if (liveVideoRef.current) {
                                            liveVideoRef.current
                                                .play()
                                                .catch(() => {});
                                        }
                                    }}
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                                <canvas
                                    ref={liveCanvasRef}
                                    className="hidden"
                                />

                                {/* HUD Crosshairs */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                                    <div
                                        className={`size-48 sm:size-56 border-2 border-dashed rounded-2xl transition-all duration-300 flex items-center justify-center ${
                                            scanPulse
                                                ? "border-emerald-400 scale-105 shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                                                : "border-emerald-500/35"
                                        }`}
                                    >
                                        <div className="size-4 border-t-2 border-l-2 border-emerald-400 absolute top-2 left-2" />
                                        <div className="size-4 border-t-2 border-r-2 border-emerald-400 absolute top-2 right-2" />
                                        <div className="size-4 border-b-2 border-l-2 border-emerald-400 absolute bottom-2 left-2" />
                                        <div className="size-4 border-b-2 border-r-2 border-emerald-400 absolute bottom-2 right-2" />
                                    </div>
                                </div>

                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-2 border border-slate-700/60">
                                    <Radio className="size-3 text-emerald-400 animate-pulse" />
                                    <span>30 FPS LIVE STREAM</span>
                                </div>

                                {lastActivityTime && (
                                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                                        Last recognition: {lastActivityTime}
                                    </div>
                                )}
                            </div>

                            {/* Live Recognition & VIP Perks Intelligence Card */}
                            <div className="lg:col-span-5 bg-slate-900/95 rounded-xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                            <Sparkles className="size-3.5 text-amber-400" />
                                            Live Face Intelligence
                                        </span>
                                        {isScanning && (
                                            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                                                <RefreshCw className="size-3 animate-spin" />
                                                Extracting Embedding...
                                            </span>
                                        )}
                                    </div>

                                    {liveScanResult ? (
                                        <div className="mt-3 space-y-3">
                                            {liveScanResult.error ? (
                                                <div className="p-3.5 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs space-y-1">
                                                    <p className="font-semibold flex items-center gap-1.5">
                                                        <AlertCircle className="size-4 text-rose-400" />
                                                        {liveScanResult.message ||
                                                            "Face scanning error"}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Please face camera in
                                                        good lighting.
                                                        Anti-spoofing rejected
                                                        phone screens/photos.
                                                    </p>
                                                </div>
                                            ) : liveScanResult.status ===
                                              "NO_FACE_DETECTED" ? (
                                                <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 text-xs text-center space-y-2">
                                                    <Radio className="size-6 text-emerald-500/70 animate-pulse mx-auto" />
                                                    <p className="font-medium text-slate-300">
                                                        Searching entrance
                                                        camera view...
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Customer walks into
                                                        frame &rarr;
                                                        auto-identified in 35ms.
                                                    </p>
                                                </div>
                                            ) : liveScanResult.status ===
                                              "RETURNING" ? (
                                                <div className="p-4 bg-emerald-950/40 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs space-y-3 shadow-lg">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                                                            <CheckCircle2 className="size-4 text-emerald-400" />
                                                            Returning Customer
                                                            Verified!
                                                        </span>
                                                        <span className="font-bold px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs flex items-center gap-1">
                                                            <Star className="size-3 fill-current text-amber-400" />
                                                            Visit #
                                                            {
                                                                liveScanResult
                                                                    .customer
                                                                    ?.totalVisits
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* Customer Avatar & Identity */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-14 rounded-xl overflow-hidden bg-slate-800 border-2 border-emerald-500/60 shrink-0 shadow">
                                                            {liveScanResult
                                                                .customer
                                                                ?.avatarUrl ? (
                                                                <img
                                                                    src={
                                                                        liveScanResult
                                                                            .customer
                                                                            .avatarUrl
                                                                    }
                                                                    alt="Face Snapshot"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <UserCheck className="size-8 text-emerald-400 m-auto mt-2.5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-white text-base font-bold">
                                                                {liveScanResult
                                                                    .customer
                                                                    ?.displayName ||
                                                                    liveScanResult
                                                                        .customer
                                                                        ?.customerCode}
                                                            </div>
                                                            <div className="text-[11px] font-mono text-slate-400">
                                                                #
                                                                {
                                                                    liveScanResult
                                                                        .customer
                                                                        ?.customerCode
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* VIP Tier & Discount Status Callout */}
                                                    {activePerks && (
                                                        <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Badge
                                                                    className={`${activePerks.badgeColor} text-[11px] font-semibold gap-1`}
                                                                >
                                                                    <Crown className="size-3" />
                                                                    {
                                                                        activePerks.tierLabel
                                                                    }
                                                                </Badge>
                                                                <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                                                                    <Tag className="size-3" />
                                                                    {
                                                                        activePerks.discountLabel
                                                                    }
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span>
                                                                        Loyalty
                                                                        Progression
                                                                    </span>
                                                                    <span className="text-slate-300 font-medium">
                                                                        {
                                                                            activePerks.nextTierText
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${activePerks.progressPercent}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Debounced Session Notice */}
                                                    <div className="flex items-center gap-2 text-[11px]">
                                                        {liveScanResult.isNewDiningSession ===
                                                        false ? (
                                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded flex items-center gap-1">
                                                                <Clock className="size-3" />
                                                                Current meal
                                                                session active
                                                                (4-hr debounce)
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1">
                                                                <Check className="size-3" />
                                                                New dining visit
                                                                incremented
                                                            </span>
                                                        )}
                                                    </div>

                                                    {liveScanResult.customer
                                                        ?.notes && (
                                                        <div className="p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px] text-amber-200">
                                                            <strong className="text-amber-400">
                                                                Preferences:
                                                            </strong>{" "}
                                                            {
                                                                liveScanResult
                                                                    .customer
                                                                    .notes
                                                            }
                                                        </div>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleOpenEdit(
                                                                liveScanResult.customer,
                                                            )
                                                        }
                                                        className="w-full mt-1 border-emerald-600/60 text-emerald-300 hover:bg-emerald-950/40 text-xs h-7 gap-1.5"
                                                    >
                                                        <Edit2 className="size-3" />
                                                        Edit Profile &amp;
                                                        Preferences
                                                    </Button>
                                                </div>
                                            ) : liveScanResult.status ===
                                              "NEW" ? (
                                                <div className="p-4 bg-blue-950/40 border border-blue-700/60 rounded-xl text-blue-200 text-xs space-y-3 shadow-lg">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm text-blue-300 flex items-center gap-1.5">
                                                            <UserCheck className="size-4 text-blue-400" />
                                                            New Guest
                                                            Auto-Enrolled!
                                                        </span>
                                                        <span className="font-bold px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-xs">
                                                            1st Visit
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="size-14 rounded-xl overflow-hidden bg-slate-800 border-2 border-blue-500/60 shrink-0 shadow">
                                                            {liveScanResult
                                                                .customer
                                                                ?.avatarUrl ? (
                                                                <img
                                                                    src={
                                                                        liveScanResult
                                                                            .customer
                                                                            .avatarUrl
                                                                    }
                                                                    alt="Face Snapshot"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <UserCheck className="size-8 text-blue-400 m-auto mt-2.5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm">
                                                                Generated Code:{" "}
                                                                <strong className="font-mono text-amber-400 text-base">
                                                                    #
                                                                    {
                                                                        liveScanResult
                                                                            .customer
                                                                            ?.customerCode
                                                                    }
                                                                </strong>
                                                            </p>
                                                            <p className="text-[11px] text-slate-300 mt-0.5">
                                                                Real face
                                                                snapshot
                                                                recorded
                                                                offline.
                                                                Standard menu
                                                                rates apply.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {liveScanResult.customer && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleOpenEdit(
                                                                    liveScanResult.customer,
                                                                )
                                                            }
                                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5"
                                                        >
                                                            <Plus className="size-3.5" />
                                                            Attach Real Name
                                                            &amp; VIP Tier
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 space-y-1.5">
                                            <Camera className="size-8 mx-auto text-slate-600 mb-1" />
                                            <p className="text-xs font-medium text-slate-400">
                                                Waiting for face...
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Stand in front of the camera or
                                                click &quot;Instant Snap&quot;.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                                    <span>Anti-Spoofing: MiniFASNet</span>
                                    <span>
                                        Match Threshold: Cosine &ge; 0.363
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {cameraError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 text-rose-500 shrink-0" />
                    <span>{cameraError}</span>
                </div>
            )}

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {isOwnerView
                                        ? "Brand-Wide Enrolled Faces"
                                        : "Total Enrolled Faces"}
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                    {stats.totalEnrolledCustomers}
                                </p>
                            </div>
                            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-full">
                                <UserCheck className="size-5" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Unique biometric customers
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Total Dining Visits
                                </p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    {stats.totalVisitsAccumulated}
                                </p>
                            </div>
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                                <Calendar className="size-5" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Debounced dining sessions
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    VIP &amp; VVIP Guests
                                </p>
                                <p className="text-2xl font-bold text-amber-500 mt-1">
                                    {stats.vipCount}
                                </p>
                            </div>
                            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full">
                                <Crown className="size-5" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            10% &amp; 15% discount eligible
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-850 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Regular Guests
                                </p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                                    {stats.regularCount}
                                </p>
                            </div>
                            <div className="p-2.5 bg-slate-500/10 text-slate-500 rounded-full">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                            Active customer pool
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search, Branch Switcher & View Mode Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search code (#CUST-XXXX), name, phone, notes..."
                            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                        />
                    </div>

                    {/* Owner Branch Switcher */}
                    {isOwnerView && (
                        <Select
                            value={selectedBranchFilter}
                            onValueChange={val => {
                                setSelectedBranchFilter(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-40 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                                <SelectValue placeholder="All Branches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">
                                    🏢 All Branches
                                </SelectItem>
                                {branches.map(b => (
                                    <SelectItem
                                        key={b.id}
                                        value={b.id}
                                        className="text-xs"
                                    >
                                        {b.name} ({b.displayCode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Select
                        value={tierFilter}
                        onValueChange={val => {
                            setTierFilter(val);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-36 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                            <SelectValue placeholder="All Tiers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Tiers</SelectItem>
                            <SelectItem value="REGULAR">
                                Regular (Standard)
                            </SelectItem>
                            <SelectItem value="VIP">VIP (10% Off)</SelectItem>
                            <SelectItem value="VVIP">VVIP (15% Off)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* View Mode Toggle: Cards vs DataTable */}
                <div className="flex items-center gap-2 self-end lg:self-auto">
                    <span className="text-xs text-slate-400 font-medium">
                        View:
                    </span>
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900">
                        <Button
                            variant={viewMode === "cards" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("cards")}
                            className={`h-7 px-3 text-xs gap-1.5 ${
                                viewMode === "cards"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <LayoutGrid className="size-3.5" />
                            Cards
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("table")}
                            className={`h-7 px-3 text-xs gap-1.5 ${
                                viewMode === "table"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                            <List className="size-3.5" />
                            DataTable
                        </Button>
                    </div>
                </div>
            </div>

            {/* MAIN CUSTOMER VIEW: CARDS VS DATATABLE */}
            {viewMode === "table" ? (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <DataTable
                            columns={tableColumns}
                            data={data?.items || []}
                            rowKey={row => row.id}
                            empty={
                                <div className="py-12 text-center text-slate-500 space-y-2">
                                    <UserCheck className="size-8 mx-auto text-slate-400" />
                                    <p className="text-sm font-semibold">
                                        No customers enrolled yet
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Turn on the live camera or upload a test
                                        photo to enroll guests.
                                    </p>
                                </div>
                            }
                            showColumnToggle={true}
                            searchPlaceholder={null}
                        />
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card
                            key={i}
                            className="animate-pulse h-44 bg-slate-100 dark:bg-slate-900/60"
                        />
                    ))}
                </div>
            ) : !data?.items?.length ? (
                <Card className="text-center py-12 border-dashed border-2">
                    <CardContent className="space-y-3">
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto">
                            <Users className="size-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            No Customers Enrolled Yet
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Start the camera scanner to auto-enroll customers
                            when they walk in, or upload a photo manually.
                        </p>
                        <Button
                            onClick={() => startLiveCamera()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs"
                        >
                            <Video className="size-3.5" />
                            Start Live Camera Scanner
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.items.map((c: CustomerBiometricProfile) => {
                        const perks = getVipPerks(c.vipTier, c.totalVisits);
                        return (
                            <Card
                                key={c.id}
                                className="group hover:border-amber-500/50 transition-all duration-200 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow"
                            >
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {/* Customer Photo Thumbnail */}
                                            <div className="size-13 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 group-hover:border-amber-500/40 transition shrink-0 shadow-sm flex items-center justify-center">
                                                {c.avatarUrl ? (
                                                    <img
                                                        src={c.avatarUrl}
                                                        alt={
                                                            c.displayName ||
                                                            c.customerCode
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <UserCheck className="size-6 text-slate-400" />
                                                )}
                                            </div>

                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-750">
                                                        #{c.customerCode}
                                                    </span>
                                                    <Badge
                                                        className={`${perks.badgeColor} text-[10px] gap-1`}
                                                    >
                                                        {c.vipTier ===
                                                            "VVIP" && (
                                                            <Sparkles className="size-3" />
                                                        )}
                                                        {c.vipTier ===
                                                            "VIP" && (
                                                            <Crown className="size-3" />
                                                        )}
                                                        {perks.tierLabel}
                                                    </Badge>
                                                </div>

                                                <h4 className="font-semibold text-slate-900 dark:text-white pt-1 text-sm">
                                                    {c.displayName ? (
                                                        c.displayName
                                                    ) : (
                                                        <span
                                                            onClick={() =>
                                                                handleOpenEdit(
                                                                    c,
                                                                )
                                                            }
                                                            className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1 italic text-xs font-normal"
                                                        >
                                                            <Edit2 className="size-3" />
                                                            Unnamed Guest —
                                                            Click to name
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleOpenEdit(c)
                                                }
                                                className="size-7 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                                title="Edit Profile"
                                            >
                                                <Edit2 className="size-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(
                                                        c.id,
                                                        c.displayName ||
                                                            c.customerCode,
                                                    )
                                                }
                                                className="size-7 text-slate-400 hover:text-rose-500"
                                                title="Remove Biometric Profile"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* VIP Discount & Progress Callout */}
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Tag className="size-3 text-amber-500" />
                                                Perk:
                                            </span>
                                            <strong className="text-amber-600 dark:text-amber-400 font-semibold">
                                                {perks.discountLabel}
                                            </strong>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] text-slate-400">
                                                <span>
                                                    {c.totalVisits}{" "}
                                                    {c.totalVisits === 1
                                                        ? "visit"
                                                        : "visits"}
                                                </span>
                                                <span>
                                                    {perks.nextTierText}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-amber-500 h-1.5 rounded-full"
                                                    style={{
                                                        width: `${perks.progressPercent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                            <Calendar className="size-3.5 text-emerald-500 shrink-0" />
                                            <span>
                                                {c.totalVisits}{" "}
                                                {c.totalVisits === 1
                                                    ? "Visit"
                                                    : "Visits"}
                                            </span>
                                        </div>

                                        {c.phone ? (
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                                                <Phone className="size-3.5 text-blue-500 shrink-0" />
                                                <span className="truncate">
                                                    {c.phone}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 italic">
                                                No phone
                                            </div>
                                        )}
                                    </div>

                                    {c.notes && (
                                        <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded border border-amber-500/20 line-clamp-2">
                                            <strong>Prefers:</strong> {c.notes}
                                        </p>
                                    )}

                                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <span>
                                            Enrolled: {c.branch?.name || "Kera"}
                                        </span>
                                        <span>
                                            Last:{" "}
                                            {new Date(
                                                c.lastVisitAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* EDIT CUSTOMER MODAL */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit2 className="size-4 text-amber-500" />
                            Edit Customer Profile (#
                            {selectedCustomer?.customerCode})
                        </DialogTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Enrich the recognized guest with their real name,
                            contact info, and hospitality notes.
                        </p>
                    </DialogHeader>

                    <form
                        onSubmit={handleSaveEdit}
                        className="space-y-3.5 py-2"
                    >
                        <div>
                            <Label className="text-xs">
                                Full Name / Nickname
                            </Label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="e.g. Mr. Minilik, Dr. Sarah"
                                className="mt-1 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Phone Number</Label>
                                <Input
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    placeholder="+251 9..."
                                    className="mt-1 text-sm"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">VIP Status</Label>
                                <Select
                                    value={editTier}
                                    onValueChange={val =>
                                        setEditTier(val as CustomerVipTier)
                                    }
                                >
                                    <SelectTrigger className="mt-1 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">
                                            Regular (Standard)
                                        </SelectItem>
                                        <SelectItem value="VIP">
                                            VIP (10% Off)
                                        </SelectItem>
                                        <SelectItem value="VVIP">
                                            VVIP (15% Off)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">
                                Dining Preferences &amp; Allergies
                            </Label>
                            <Textarea
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                placeholder="e.g. Table 4 preference, sparkling water with lime, dairy allergy..."
                                rows={2}
                                className="mt-1 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdating}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isUpdating ? "Saving..." : "Save Profile"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* CREATE / ENROLL CUSTOMER MODAL */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="size-4 text-amber-500" />
                            Enroll New Customer Face
                        </DialogTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Capture or upload a front-facing portrait to
                            generate their offline 128-d biometric embedding.
                        </p>
                    </DialogHeader>

                    <form
                        onSubmit={handleSaveCreate}
                        className="space-y-4 py-2"
                    >
                        <div>
                            <Label className="text-xs">
                                Portrait Photo (Required for Face Vector)
                            </Label>

                            <div className="mt-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[160px]">
                                {createPhotoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={createPhotoPreview}
                                            alt="Preview"
                                            className="size-36 rounded-xl object-cover shadow"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                                setCreatePhoto(null);
                                                setCreatePhotoPreview(null);
                                            }}
                                            className="absolute -top-2 -right-2 size-6 p-0 rounded-full"
                                        >
                                            &times;
                                        </Button>
                                    </div>
                                ) : isCreateCameraActive ? (
                                    <div className="space-y-2">
                                        <div className="relative size-40 rounded-xl overflow-hidden bg-black mx-auto">
                                            <video
                                                ref={createVideoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover mirror"
                                                style={{
                                                    transform: "scaleX(-1)",
                                                }}
                                            />
                                            <canvas
                                                ref={createCanvasRef}
                                                className="hidden"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={takeCreateSnapshot}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                                            >
                                                <Camera className="size-3.5" />
                                                Snap Photo
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={stopCreateCamera}
                                                className="text-xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        <Camera className="size-8 text-slate-400 mx-auto" />
                                        <p className="text-xs text-slate-500">
                                            Snap with webcam or upload a clear
                                            portrait photo
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={startCreateCamera}
                                                className="gap-1.5 text-xs border-slate-300 dark:border-slate-700"
                                            >
                                                <Camera className="size-3.5 text-amber-500" />
                                                Use Camera
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="gap-1.5 text-xs border-slate-300 dark:border-slate-700"
                                            >
                                                <Upload className="size-3.5 text-blue-500" />
                                                Choose File
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setCreatePhoto(f);
                                            setCreatePhotoPreview(
                                                URL.createObjectURL(f),
                                            );
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">
                                    Full Name / Nickname
                                </Label>
                                <Input
                                    value={createName}
                                    onChange={e =>
                                        setCreateName(e.target.value)
                                    }
                                    placeholder="Optional (defaults to CUST-XXXX)"
                                    className="mt-1 text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Phone Number</Label>
                                <Input
                                    value={createPhone}
                                    onChange={e =>
                                        setCreatePhone(e.target.value)
                                    }
                                    placeholder="Optional"
                                    className="mt-1 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">VIP Status</Label>
                                <Select
                                    value={createTier}
                                    onValueChange={val =>
                                        setCreateTier(val as CustomerVipTier)
                                    }
                                >
                                    <SelectTrigger className="mt-1 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="REGULAR">
                                            Regular (Standard)
                                        </SelectItem>
                                        <SelectItem value="VIP">
                                            VIP (10% Off)
                                        </SelectItem>
                                        <SelectItem value="VVIP">
                                            VVIP (15% Off)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Initial Notes</Label>
                                <Input
                                    value={createNotes}
                                    onChange={e =>
                                        setCreateNotes(e.target.value)
                                    }
                                    placeholder="e.g. VIP booth prefer"
                                    className="mt-1 text-sm"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isCreating || !createPhoto}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isCreating
                                    ? "Extracting Vector..."
                                    : "Enroll Customer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* UPLOAD TEST PHOTO MODAL */}
            <Dialog open={isTestScanOpen} onOpenChange={setIsTestScanOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload className="size-4 text-blue-500" />
                            Upload Test Photo
                        </DialogTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Select any portrait photo from your computer to test
                            the face recognition engine.
                        </p>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div
                            onClick={() => testFileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition flex flex-col items-center justify-center min-h-[140px]"
                        >
                            {testPhotoPreview ? (
                                <img
                                    src={testPhotoPreview}
                                    alt="Preview"
                                    className="size-32 rounded-xl object-cover shadow"
                                />
                            ) : (
                                <div className="space-y-1.5 text-slate-500">
                                    <Upload className="size-8 mx-auto text-slate-400" />
                                    <p className="text-xs font-medium">
                                        Click to select photo
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        JPG, PNG, or WEBP
                                    </p>
                                </div>
                            )}
                            <input
                                ref={testFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        setTestPhoto(f);
                                        setTestPhotoPreview(
                                            URL.createObjectURL(f),
                                        );
                                        setTestScanResult(null);
                                    }
                                }}
                            />
                        </div>

                        {testScanResult && (
                            <div
                                className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                                    testScanResult.error
                                        ? "bg-rose-950/30 border-rose-800 text-rose-300"
                                        : testScanResult.status === "RETURNING"
                                          ? "bg-emerald-950/30 border-emerald-700 text-emerald-200"
                                          : "bg-blue-950/30 border-blue-700 text-blue-200"
                                }`}
                            >
                                {testScanResult.error ? (
                                    <p className="font-semibold flex items-center gap-1.5">
                                        <AlertCircle className="size-4 text-rose-400" />
                                        {testScanResult.message}
                                    </p>
                                ) : testScanResult.status === "RETURNING" ? (
                                    <>
                                        <p className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                                            <CheckCircle2 className="size-4 text-emerald-400" />
                                            Returning Customer Recognized!
                                        </p>
                                        <p className="text-slate-200 font-semibold">
                                            {testScanResult.customer
                                                .displayName ||
                                                testScanResult.customer
                                                    .customerCode}
                                        </p>
                                        <div className="flex gap-4 text-[11px] text-slate-300 pt-1">
                                            <span>
                                                Visits:{" "}
                                                <strong>
                                                    {
                                                        testScanResult.customer
                                                            .totalVisits
                                                    }
                                                </strong>
                                            </span>
                                            <span>
                                                Match:{" "}
                                                <strong>
                                                    {(
                                                        testScanResult.matchScore *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </strong>
                                            </span>
                                            <span>
                                                Tier:{" "}
                                                <strong>
                                                    {
                                                        testScanResult.customer
                                                            .vipTier
                                                    }
                                                </strong>
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold text-sm text-blue-300 flex items-center gap-1.5">
                                            <UserCheck className="size-4 text-blue-400" />
                                            New Guest Auto-Enrolled!
                                        </p>
                                        <p className="text-slate-200">
                                            Code:{" "}
                                            <strong className="font-mono text-amber-400">
                                                #
                                                {
                                                    testScanResult.customer
                                                        .customerCode
                                                }
                                            </strong>
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Assigned 1st visit. Saved vector in
                                            PostgreSQL.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTestScanOpen(false)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={!testPhoto || isScanning}
                                onClick={handleRunTestScan}
                                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                            >
                                <Zap className="size-3.5 fill-current" />
                                {isScanning ? "Scanning..." : "Execute Scan"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

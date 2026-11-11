"use client";

import { useEffect, useRef, useState } from "react";
import { RestorchSpinner } from "@/components/common/RestorchSpinner";
import {
    Bot,
    Mic,
    Radio,
    Settings,
    Sliders,
    Square,
    Terminal,
    Trash2,
    Volume2,
    X,
} from "lucide-react";
import PageHeader from "@/components/custom/organisms/PageHeader";
import { Button } from "@/components/ui/button";
import {
    ChatMessage,
    useAskAiMutation,
    useTranscribeAudioMutation,
} from "@/context/services/aiApi";
import { cn } from "@/lib/utils";

type ExtendedMessage = ChatMessage & {
    id: string;
    sqlQuery?: string;
    rowCount?: number;
    audioBase64?: string;
    timestamp: Date;
};

const TTS_VOICES = [
    { id: "alloy", name: "Alloy", desc: "Balanced & natural" },
    { id: "nova", name: "Nova", desc: "Warm & energetic" },
    { id: "echo", name: "Echo", desc: "Smooth & gentle" },
    { id: "shimmer", name: "Shimmer", desc: "Clear & expressive" },
    { id: "onyx", name: "Onyx", desc: "Deep & authoritative" },
    { id: "fable", name: "Fable", desc: "British & professional" },
];

export default function OwnerAiPage() {
    const [messages, setMessages] = useState<ExtendedMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hello! I am your AI Business Advisor. Hold the circular wave orb to ask me about today's revenue, bottles sold, inventory, or staff shifts.",
            timestamp: new Date(),
        },
    ]);
    const [engine, setEngine] = useState<"sql" | "tools">("tools");
    const [voice, setVoice] = useState("alloy");
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    // Accordion for tool inspection
    const [expandedSqlIds, setExpandedSqlIds] = useState<
        Record<string, boolean>
    >({});

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const isHoldingRef = useRef(false);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [askAi, { isLoading }] = useAskAiMutation();
    const [transcribeAudio] = useTranscribeAudioMutation();

    // Cleanup audio and recording timer on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        };
    }, []);

    function playAudio(audioBase64?: string) {
        if (!audioBase64) return;

        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }

        try {
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
            currentAudioRef.current = audio;
            setIsPlayingAudio(true);

            audio.onended = () => {
                setIsPlayingAudio(false);
                currentAudioRef.current = null;
            };

            audio.onerror = () => {
                setIsPlayingAudio(false);
                currentAudioRef.current = null;
            };

            audio.play().catch(() => {
                setIsPlayingAudio(false);
            });
        } catch {
            setIsPlayingAudio(false);
        }
    }

    function stopAudio() {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setIsPlayingAudio(false);
    }

    // Start browser audio recording (supports Press & Hold push-to-talk)
    async function startRecording() {
        stopAudio();
        isHoldingRef.current = true;
        setRecordingSeconds(0);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            audioChunksRef.current = [];

            const isWebmOpus = MediaRecorder.isTypeSupported(
                "audio/webm;codecs=opus",
            );
            const isWebm = MediaRecorder.isTypeSupported("audio/webm");
            const isMp4 = MediaRecorder.isTypeSupported("audio/mp4");

            const recordingMime = isWebmOpus
                ? "audio/webm;codecs=opus"
                : isWebm
                  ? "audio/webm"
                  : isMp4
                    ? "audio/mp4"
                    : "";

            const cleanMime = isMp4 ? "audio/mp4" : "audio/webm";

            const recorder = recordingMime
                ? new MediaRecorder(stream, { mimeType: recordingMime })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }
                setRecordingSeconds(0);
                await handleRecordedAudio(cleanMime);
            };

            recorder.start(100);
            setIsRecording(true);

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds(prev => prev + 1);
            }, 1000);

            // If user released the hold before getUserMedia finished granting:
            if (!isHoldingRef.current) {
                setTimeout(() => {
                    stopRecording();
                }, 300);
            }
        } catch {
            alert(
                "Microphone access denied or unavailable. Please allow microphone access in your browser.",
            );
            setIsRecording(false);
            isHoldingRef.current = false;
        }
    }

    // Stop recording and process
    function stopRecording() {
        isHoldingRef.current = false;
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            try {
                mediaRecorderRef.current.requestData();
            } catch {
                // ignore
            }
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    }

    // Convert recorded audio blob to base64, transcribe with Whisper, and send
    async function handleRecordedAudio(cleanMime: string) {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        if (audioBlob.size < 500) {
            return;
        }

        setIsTranscribing(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Data = (reader.result as string) || "";
            try {
                const res = await transcribeAudio({
                    audioBase64: base64Data,
                    mimeType: cleanMime,
                }).unwrap();

                const spokenText = res.text?.trim();
                if (spokenText) {
                    await handleSend(spokenText);
                }
            } catch {
                alert("Voice transcription failed. Please try speaking again.");
            } finally {
                setIsTranscribing(false);
            }
        };
    }

    async function handleSend(textToSend: string) {
        const text = textToSend.trim();
        if (!text || isLoading || isTranscribing) return;

        stopAudio();

        const userMsg: ExtendedMessage = {
            id: `${Date.now()}-user`,
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);

        const history: ChatMessage[] = updatedMessages
            .filter(m => m.id !== "welcome")
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content }));

        try {
            const res = await askAi({
                message: text,
                history,
                engine,
                voiceResponse: autoSpeak,
                voice,
            }).unwrap();

            const assistantMsg: ExtendedMessage = {
                id: `${Date.now()}-assistant`,
                role: "assistant",
                content: res.reply,
                sqlQuery: res.sqlQuery,
                rowCount: res.rowCount,
                audioBase64: res.audioBase64,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);

            if (autoSpeak && res.audioBase64) {
                playAudio(res.audioBase64);
            }
        } catch (err: unknown) {
            const errorMsg: ExtendedMessage = {
                id: `${Date.now()}-err`,
                role: "assistant",
                content:
                    (err as { data?: { message?: string } })?.data?.message ||
                    (err as { error?: string })?.error ||
                    "An error occurred while analyzing the database. Please try asking again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    }

    function toggleSql(id: string) {
        setExpandedSqlIds(prev => ({ ...prev, [id]: !prev[id] }));
    }

    function clearConversation() {
        stopAudio();
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content:
                    "Conversation cleared. How can I assist you with your restaurant analytics today?",
                timestamp: new Date(),
            },
        ]);
        setSettingsOpen(false);
    }

    const latestAssistantMsg = [...messages]
        .reverse()
        .find(m => m.role === "assistant" && m.id !== "welcome");
    const latestUserMsg = [...messages].reverse().find(m => m.role === "user");

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-3 sm:p-6 max-w-5xl mx-auto">
            {/* Top Minimal Navigation Bar */}
            <div className="flex items-center justify-between gap-3 px-1">
                <PageHeader
                    compact
                    eyebrow="Intelligence"
                    title="Voice Advisor"
                    description="Real-time voice intelligence for restaurant owners"
                />

                {/* Settings Modal Button */}
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSettingsOpen(true)}
                    className="size-9 rounded-full border-slate-300/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
                    title="AI Advisor Settings"
                >
                    <Settings className="size-4" />
                </Button>
            </div>

            {/* PURE VOICE CANVAS: Apple Emotion-Inspired Concentric Circular Wave Canvas */}
            <div className="flex-1 flex flex-col items-center justify-between rounded-[36px] border border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-sky-50/70 via-slate-50/50 to-indigo-50/40 dark:from-slate-900/90 dark:via-slate-950 dark:to-black p-6 sm:p-12 shadow-xl relative overflow-hidden transition-colors">
                {/* Ambient Glow Orbs */}
                <div
                    className={cn(
                        "absolute -top-32 -left-32 size-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-40 dark:opacity-30",
                        isRecording
                            ? "bg-rose-400 dark:bg-rose-600"
                            : isPlayingAudio
                              ? "bg-sky-400 dark:bg-sky-500"
                              : isLoading || isTranscribing
                                ? "bg-indigo-400 dark:bg-indigo-600"
                                : "bg-sky-300 dark:bg-sky-600/60",
                    )}
                />
                <div
                    className={cn(
                        "absolute -bottom-32 -right-32 size-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30 dark:opacity-20",
                        isRecording
                            ? "bg-red-400 dark:bg-red-600"
                            : "bg-cyan-300 dark:bg-cyan-600/50",
                    )}
                />

                {/* Top Status Pill */}
                <div className="z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-slate-200/80 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                    <Radio
                        className={cn(
                            "size-3.5",
                            isRecording
                                ? "text-rose-500 animate-pulse"
                                : isPlayingAudio
                                  ? "text-sky-500 dark:text-sky-400 animate-pulse"
                                  : isLoading || isTranscribing
                                    ? "text-indigo-500 dark:text-indigo-400 animate-spin"
                                    : "text-emerald-500",
                        )}
                    />
                    <span>
                        {isRecording
                            ? `Listening (${recordingSeconds}s)... Release when done`
                            : isTranscribing
                              ? "Transcribing with Whisper..."
                              : isLoading
                                ? "Analyzing restaurant data..."
                                : isPlayingAudio
                                  ? "Speaking answer..."
                                  : "Ready • Hold the orb to speak"}
                    </span>
                </div>

                {/* CENTRAL CONCENTRIC CIRCULAR WAVE ORB */}
                <div className="relative my-auto flex flex-col items-center justify-center text-center">
                    <div className="relative flex items-center justify-center">
                        {/* Animated Sound Wave Ripples radiating outward */}
                        {isPlayingAudio && (
                            <>
                                <div className="absolute size-72 sm:size-96 rounded-full border border-sky-400/50 dark:border-sky-400/30 animate-ping" />
                                <div className="absolute size-88 sm:size-[400px] rounded-full border border-cyan-400/40 dark:border-cyan-400/20 animate-pulse" />
                                <div className="absolute size-64 sm:size-80 rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-xl animate-pulse" />
                            </>
                        )}
                        {isRecording && (
                            <>
                                <div className="absolute size-72 sm:size-96 rounded-full border-2 border-rose-400/50 dark:border-rose-500/40 animate-ping" />
                                <div className="absolute size-88 sm:size-[400px] rounded-full border border-rose-500/30 animate-pulse" />
                                <div className="absolute size-64 sm:size-80 rounded-full bg-rose-500/15 blur-xl animate-pulse" />
                            </>
                        )}
                        {(isLoading || isTranscribing) && (
                            <div className="absolute size-72 sm:size-96 rounded-full border-2 border-dashed border-sky-400/40 dark:border-sky-400/30 animate-spin" />
                        )}

                        {/* Concentric Layer 1: Outer Translucent Glass Disk */}
                        <div
                            className={cn(
                                "size-64 sm:size-80 rounded-full flex items-center justify-center transition-all duration-700 backdrop-blur-2xl border shadow-xl",
                                isRecording
                                    ? "border-rose-300/70 bg-gradient-to-br from-rose-100/60 via-rose-50/40 to-white/50 dark:from-rose-950/40 dark:via-slate-900/40 dark:to-rose-950/20 dark:border-rose-500/30 shadow-rose-500/20"
                                    : isPlayingAudio
                                      ? "border-sky-300/70 bg-gradient-to-br from-sky-100/60 via-cyan-50/40 to-white/50 dark:from-sky-950/50 dark:via-slate-900/50 dark:to-sky-950/30 dark:border-sky-400/30 shadow-sky-500/25 scale-105"
                                      : "border-sky-200/60 bg-gradient-to-br from-sky-100/40 via-white/50 to-sky-50/30 dark:from-sky-950/40 dark:via-slate-900/40 dark:to-sky-950/20 dark:border-sky-500/20 shadow-sky-500/10",
                            )}
                        >
                            {/* Concentric Layer 2: Middle Soft Ripple Ring */}
                            <div
                                className={cn(
                                    "size-48 sm:size-60 rounded-full flex items-center justify-center transition-all duration-500 border shadow-inner",
                                    isRecording
                                        ? "border-rose-300/80 bg-gradient-to-br from-rose-200/60 via-rose-100/40 to-white/60 dark:from-rose-900/50 dark:via-rose-950/40 dark:to-slate-900/40 dark:border-rose-400/30"
                                        : isPlayingAudio
                                          ? "border-sky-300/80 bg-gradient-to-br from-sky-200/60 via-cyan-100/40 to-white/60 dark:from-sky-900/60 dark:via-cyan-950/40 dark:to-slate-900/50 dark:border-sky-300/40"
                                          : "border-sky-200/70 bg-gradient-to-br from-sky-200/40 via-sky-100/40 to-white/50 dark:from-sky-900/40 dark:via-sky-950/30 dark:to-slate-900/40 dark:border-sky-400/20",
                                )}
                            >
                                {/* Concentric Layer 3: Inner Focal Ring */}
                                <div
                                    className={cn(
                                        "size-36 sm:size-44 rounded-full flex items-center justify-center transition-all duration-300 border shadow-md",
                                        isRecording
                                            ? "border-rose-400/80 bg-gradient-to-tr from-rose-300/60 to-rose-100/40 dark:from-rose-800/60 dark:to-rose-900/30 dark:border-rose-400/50"
                                            : isPlayingAudio
                                              ? "border-sky-400/80 bg-gradient-to-tr from-sky-300/60 to-cyan-100/50 dark:from-sky-700/60 dark:to-sky-900/40 dark:border-sky-300/50 scale-105"
                                              : "border-sky-300/70 bg-gradient-to-tr from-sky-300/30 to-sky-100/30 dark:from-sky-800/30 dark:to-sky-900/20 dark:border-sky-400/30",
                                    )}
                                >
                                    {/* Interactive Core Center Orb (Press & Hold to talk) */}
                                    <button
                                        type="button"
                                        onPointerDown={e => {
                                            e.preventDefault();
                                            if (isLoading || isTranscribing)
                                                return;
                                            if (isPlayingAudio) {
                                                stopAudio();
                                                return;
                                            }
                                            void startRecording();
                                        }}
                                        onPointerUp={e => {
                                            e.preventDefault();
                                            if (isRecording) stopRecording();
                                        }}
                                        onPointerLeave={e => {
                                            e.preventDefault();
                                            if (isRecording) stopRecording();
                                        }}
                                        onPointerCancel={e => {
                                            e.preventDefault();
                                            if (isRecording) stopRecording();
                                        }}
                                        onContextMenu={e => e.preventDefault()}
                                        disabled={isLoading || isTranscribing}
                                        style={{ touchAction: "none" }}
                                        className={cn(
                                            "relative size-24 sm:size-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 select-none cursor-pointer",
                                            isRecording
                                                ? "bg-gradient-to-tr from-rose-600 to-rose-500 scale-110 ring-4 ring-rose-400/60 shadow-rose-600/50"
                                                : isPlayingAudio
                                                  ? "bg-gradient-to-tr from-sky-500 via-sky-400 to-cyan-300 text-slate-950 scale-105 ring-4 ring-sky-300/60 shadow-sky-400/40"
                                                  : isTranscribing || isLoading
                                                    ? "bg-gradient-to-tr from-sky-600 to-indigo-600 ring-4 ring-sky-400/30"
                                                    : "bg-gradient-to-tr from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 ring-4 ring-sky-400/30 active:scale-95 shadow-sky-500/30",
                                        )}
                                    >
                                        {isRecording ? (
                                            <div className="flex flex-col items-center">
                                                <span className="size-2 rounded-full bg-white animate-ping mb-1" />
                                                <span className="text-[10px] font-bold font-mono">
                                                    {recordingSeconds > 0
                                                        ? `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`
                                                        : "REC"}
                                                </span>
                                            </div>
                                        ) : isTranscribing || isLoading ? (
                                            <RestorchSpinner className="size-8 " />
                                        ) : isPlayingAudio ? (
                                            <Volume2 className="size-8 animate-bounce" />
                                        ) : (
                                            <Mic className="size-8 drop-shadow-sm" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Apple Emotion-Style Typography State */}
                    <div className="mt-8 space-y-1.5 px-4 max-w-md">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
                            {isRecording
                                ? "Listening to your voice..."
                                : isTranscribing
                                  ? "Transcribing with Whisper..."
                                  : isLoading
                                    ? "Consulting restaurant data..."
                                    : isPlayingAudio
                                      ? "Speaking answer..."
                                      : "How can I help your restaurant?"}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {isRecording
                                ? "Release the orb when you finish speaking"
                                : isPlayingAudio
                                  ? "Tap the orb to stop audio playback"
                                  : isLoading || isTranscribing
                                    ? "Analyzing with Function Calling tools..."
                                    : "Press & hold the orb to speak"}
                        </p>
                    </div>
                </div>

                {/* Latest Spoken Question & Answer Card */}
                {latestAssistantMsg ? (
                    <div className="z-10 w-full max-w-xl rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 text-sm border border-slate-200/80 dark:border-white/10 text-left space-y-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        {latestUserMsg && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                You asked:{" "}
                                <span className="text-slate-900 dark:text-slate-200 font-semibold italic">
                                    "{latestUserMsg.content}"
                                </span>
                            </p>
                        )}

                        <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/60 dark:border-white/10">
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                                    <Bot className="size-3.5" />
                                    <span>AI Advisor</span>
                                </div>
                                <p className="text-[13px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                                    {latestAssistantMsg.content}
                                </p>
                            </div>

                            {latestAssistantMsg.audioBase64 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        isPlayingAudio
                                            ? stopAudio()
                                            : playAudio(
                                                  latestAssistantMsg.audioBase64,
                                              )
                                    }
                                    className={cn(
                                        "size-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs",
                                        isPlayingAudio
                                            ? "bg-rose-500 text-white animate-pulse"
                                            : "bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 hover:bg-sky-200",
                                    )}
                                    title={
                                        isPlayingAudio
                                            ? "Stop audio"
                                            : "Replay spoken answer"
                                    }
                                >
                                    {isPlayingAudio ? (
                                        <Square className="size-3.5 fill-current" />
                                    ) : (
                                        <Volume2 className="size-4" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Executed Tools Details Toggle */}
                        {latestAssistantMsg.sqlQuery && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs">
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSql(latestAssistantMsg.id)
                                    }
                                    className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-mono"
                                >
                                    <Terminal className="size-3 text-sky-600 dark:text-sky-400" />
                                    <span>
                                        {expandedSqlIds[latestAssistantMsg.id]
                                            ? latestAssistantMsg.sqlQuery.startsWith(
                                                  "Tool Calling:",
                                              )
                                                ? "Hide Tool Calls"
                                                : "Hide SQL Query"
                                            : latestAssistantMsg.sqlQuery.startsWith(
                                                    "Tool Calling:",
                                                )
                                              ? "View Executed Tool Calls"
                                              : "View Executed SQL Query"}
                                    </span>
                                    {typeof latestAssistantMsg.rowCount ===
                                        "number" && (
                                        <span className="text-slate-400">
                                            ({latestAssistantMsg.rowCount}{" "}
                                            tools)
                                        </span>
                                    )}
                                </button>
                                {expandedSqlIds[latestAssistantMsg.id] && (
                                    <pre className="mt-2 rounded-xl bg-slate-900 dark:bg-black/80 p-2.5 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                        {latestAssistantMsg.sqlQuery}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Minimalist Bottom Voice Hint */
                    <div className="z-10 text-center text-xs text-slate-400 dark:text-slate-500">
                        <span>
                            Press & hold the center orb to ask any business
                            analytics question
                        </span>
                    </div>
                )}
            </div>

            {/* AI ADVISOR SETTINGS DIALOG */}
            {settingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
                    <div
                        className="fixed inset-0"
                        onClick={() => setSettingsOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-md rounded-[24px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                    <Sliders className="size-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[15px] text-slate-900 dark:text-white">
                                        Advisor Settings
                                    </h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                                        Configure voice model and execution
                                        engine
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                className="size-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Setting 1: AI Execution Engine */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                AI Execution Engine
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEngine("tools")}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all",
                                        engine === "tools"
                                            ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold ring-2 ring-sky-500/20"
                                            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                                    )}
                                >
                                    <p className="text-xs font-bold">
                                        Tools Engine
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Function Calling (Fast & Safe)
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEngine("sql")}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all",
                                        engine === "sql"
                                            ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold ring-2 ring-sky-500/20"
                                            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                                    )}
                                >
                                    <p className="text-xs font-bold">
                                        SQL Dump
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Direct schema SQL queries
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Setting 2: Spoken Voice Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Advisor Spoken Voice
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {TTS_VOICES.map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => setVoice(v.id)}
                                        className={cn(
                                            "p-2.5 rounded-xl border text-center transition-all",
                                            voice === v.id
                                                ? "border-sky-500 bg-sky-500 text-white font-bold shadow-xs"
                                                : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                                        )}
                                    >
                                        <p className="text-xs">{v.name}</p>
                                        <p
                                            className={cn(
                                                "text-[10px] mt-0.5 truncate",
                                                voice === v.id
                                                    ? "text-sky-100"
                                                    : "text-slate-400",
                                            )}
                                        >
                                            {v.desc.split("&")[0]}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Setting 3: Auto-Speak Sound Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10">
                            <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Spoken Voice Feedback
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Automatically synthesize and speak answers
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (isPlayingAudio) stopAudio();
                                    setAutoSpeak(!autoSpeak);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    autoSpeak
                                        ? "bg-sky-600 text-white shadow-xs"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                                )}
                            >
                                {autoSpeak ? "Enabled" : "Muted"}
                            </button>
                        </div>

                        {/* Setting 4: Clear Conversation History */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearConversation}
                                className="h-9 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 gap-1.5 font-semibold"
                            >
                                <Trash2 className="size-3.5" />
                                <span>Clear Chat History</span>
                            </Button>

                            <Button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                className="h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold px-4"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

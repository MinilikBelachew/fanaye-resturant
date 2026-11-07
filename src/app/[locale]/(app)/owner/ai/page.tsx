"use client";

import { useEffect, useRef, useState } from "react";
import {
    Bot,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Database,
    Headphones,
    Loader2,
    MessagesSquare,
    Mic,
    MicOff,
    Radio,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
    Square,
    Terminal,
    Volume2,
    VolumeX,
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

const PROMPT_SUGGESTIONS = [
    {
        label: "Today's Revenue",
        query: "What is today's total revenue, total collected amount, and paid bills count?",
    },
    {
        label: "Bottles & Drinks Sold",
        query: "How many bottles and drinks were sold in the last 7 days?",
    },
    {
        label: "Top 5 Dishes",
        query: "What are the top 5 most ordered dishes this week with their quantities and revenue?",
    },
    {
        label: "Net Profit & Margins",
        query: "What is our net operating profit and profit margin after deducting manual operating expenses?",
    },
    {
        label: "Peak Rush Hours",
        query: "What are our busiest rush hours of the day based on customer order volume?",
    },
    {
        label: "Lost Revenue & Voids",
        query: "How much revenue did we lose from cancelled or voided orders, and what were the main reasons?",
    },
    {
        label: "Server Rankings",
        query: "Rank our servers by total completed sales volume and orders created.",
    },
    {
        label: "Expenses & Payouts",
        query: "How much did we spend on manual expenses and petty cash this month? Break it down by label.",
    },
    {
        label: "Customer Ratings",
        query: "What is our average customer rating and what comments or complaints did guests leave recently?",
    },
    {
        label: "Low Stock Alert",
        query: "Which inventory ingredients are currently running low or below their minimum stock threshold?",
    },
];

export default function OwnerAiPage() {
    const [messages, setMessages] = useState<ExtendedMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hello! I am your AI Voice Business Advisor. Speak to me or type your question about revenue, bottles sold, inventory, or shifts.",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [engine, setEngine] = useState<"sql" | "tools">("sql");
    const [viewMode, setViewMode] = useState<"voice" | "chat">("voice");
    const [autoSpeak, setAutoSpeak] = useState(true);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(
        null,
    );

    // SQL inspection accordion
    const [expandedSqlIds, setExpandedSqlIds] = useState<
        Record<string, boolean>
    >({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [askAi, { isLoading }] = useAskAiMutation();
    const [transcribeAudio] = useTranscribeAudioMutation();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading, isTranscribing]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
        };
    }, []);

    function playAudio(audioBase64?: string, messageId?: string) {
        if (!audioBase64) return;

        // Stop any currently playing audio
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }

        try {
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
            currentAudioRef.current = audio;
            setIsPlayingAudio(true);
            if (messageId) setPlayingMessageId(messageId);

            audio.onended = () => {
                setIsPlayingAudio(false);
                setPlayingMessageId(null);
                currentAudioRef.current = null;
            };

            audio.onerror = () => {
                setIsPlayingAudio(false);
                setPlayingMessageId(null);
                currentAudioRef.current = null;
            };

            audio.play().catch(() => {
                setIsPlayingAudio(false);
                setPlayingMessageId(null);
            });
        } catch {
            setIsPlayingAudio(false);
            setPlayingMessageId(null);
        }
    }

    function stopAudio() {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setIsPlayingAudio(false);
        setPlayingMessageId(null);
    }

    // Start browser audio recording
    async function startRecording() {
        stopAudio();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            audioChunksRef.current = [];

            // Detect supported recording mimeType
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
                await handleRecordedAudio(cleanMime);
            };

            recorder.start(100);
            setIsRecording(true);
        } catch (err: any) {
            alert(
                "Microphone access denied or unavailable. Please allow microphone access in your browser.",
            );
            setIsRecording(false);
        }
    }

    // Stop recording and process
    function stopRecording() {
        if (mediaRecorderRef.current && isRecording) {
            try {
                if (mediaRecorderRef.current.state === "recording") {
                    mediaRecorderRef.current.requestData();
                }
            } catch {
                // ignore
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }

    // Convert recorded audio blob to base64, transcribe with Whisper, and send
    async function handleRecordedAudio(cleanMime: string) {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        if (audioBlob.size < 800) {
            // Audio too brief
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
                    setInput(spokenText);
                    await handleSend(spokenText);
                }
            } catch (err: any) {
                alert("Voice transcription failed. Please try speaking again.");
            } finally {
                setIsTranscribing(false);
            }
        };
    }

    async function handleSend(textToSend?: string) {
        const text = (textToSend ?? input).trim();
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
        setInput("");

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

            // Auto-play the spoken voice response
            if (autoSpeak && res.audioBase64) {
                playAudio(res.audioBase64, assistantMsg.id);
            }
        } catch (err: any) {
            const errorMsg: ExtendedMessage = {
                id: `${Date.now()}-err`,
                role: "assistant",
                content:
                    err?.data?.message ||
                    err?.error ||
                    "An error occurred while analyzing the database. Please try asking again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    }

    function toggleSql(id: string) {
        setExpandedSqlIds(prev => ({ ...prev, [id]: !prev[id] }));
    }

    async function copyToClipboard(text: string, id: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // ignore
        }
    }

    function handleReset() {
        stopAudio();
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content:
                    "Voice session refreshed. Tap the microphone and ask any question to hear the answer.",
                timestamp: new Date(),
            },
        ]);
    }

    const latestAssistantMsg = [...messages]
        .reverse()
        .find(m => m.role === "assistant");
    const latestUserMsg = [...messages].reverse().find(m => m.role === "user");

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col space-y-3 p-3 sm:p-5 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <PageHeader
                    title="AI Voice Advisor"
                    description="Speak naturally to query revenue, bottles sold, inventory, and restaurant performance."
                />

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher: Voice Mode vs Chat Transcript */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setViewMode("voice")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                                viewMode === "voice"
                                    ? "bg-amber-500 text-white shadow-xs font-semibold"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                        >
                            <Headphones className="size-3.5" />
                            <span>Voice Mode</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("chat")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-md transition-all",
                                viewMode === "chat"
                                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                                    : "text-slate-600 hover:text-slate-900",
                            )}
                        >
                            <MessagesSquare className="size-3.5" />
                            <span>Transcript</span>
                        </button>
                    </div>

                    {/* Engine Switcher */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setEngine("sql")}
                            className={cn(
                                "px-2.5 py-1 rounded-md transition-all",
                                engine === "sql"
                                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                                    : "text-slate-500 hover:text-slate-800",
                            )}
                            title="Direct SQL generated against live PostgreSQL schema dump with Auto-Healing"
                        >
                            SQL Dump Engine
                        </button>
                        <button
                            type="button"
                            onClick={() => setEngine("tools")}
                            className={cn(
                                "px-2.5 py-1 rounded-md transition-all",
                                engine === "tools"
                                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                                    : "text-slate-500 hover:text-slate-800",
                            )}
                            title="Type-safe Prisma Function Calling tools"
                        >
                            Tools Engine
                        </button>
                    </div>

                    {/* Auto-Speak Sound Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isPlayingAudio) stopAudio();
                            setAutoSpeak(!autoSpeak);
                        }}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all",
                            autoSpeak
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-slate-100 text-slate-500 border-slate-200",
                        )}
                        title={
                            autoSpeak
                                ? "Auto-Speak is ON"
                                : "Auto-Speak is Muted"
                        }
                    >
                        {autoSpeak ? (
                            <>
                                <Volume2 className="size-3.5 text-amber-600" />
                                <span>Voice On</span>
                            </>
                        ) : (
                            <>
                                <VolumeX className="size-3.5 text-slate-400" />
                                <span>Voice Muted</span>
                            </>
                        )}
                    </button>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="size-3.5" />
                        Tenant Safe
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-8 gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
                        title="Reset voice conversation"
                    >
                        <RotateCcw className="size-3.5" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* Quick Prompts Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="flex items-center gap-1 font-semibold text-slate-500 shrink-0">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Quick voice prompts:
                </span>
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(item.query)}
                        disabled={isLoading || isRecording || isTranscribing}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT AREA */}
            {viewMode === "voice" ? (
                /* VOICE MODE: ChatGPT-style immersive voice screen */
                <div className="flex-1 flex flex-col items-center justify-between rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 sm:p-10 shadow-xl text-white relative overflow-hidden">
                    {/* Background Ambient Glow */}
                    <div
                        className={cn(
                            "absolute -top-24 -left-24 size-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30",
                            isRecording
                                ? "bg-rose-500"
                                : isPlayingAudio
                                  ? "bg-amber-400"
                                  : isLoading || isTranscribing
                                    ? "bg-blue-500"
                                    : "bg-amber-600",
                        )}
                    />
                    <div
                        className={cn(
                            "absolute -bottom-24 -right-24 size-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20",
                            isRecording ? "bg-red-600" : "bg-emerald-500",
                        )}
                    />

                    {/* Top Status Indicator */}
                    <div className="z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium">
                        <Radio
                            className={cn(
                                "size-3.5",
                                isRecording
                                    ? "text-red-400 animate-pulse"
                                    : isPlayingAudio
                                      ? "text-amber-400 animate-pulse"
                                      : isLoading || isTranscribing
                                        ? "text-blue-400 animate-spin"
                                        : "text-emerald-400",
                            )}
                        />
                        <span>
                            {isRecording
                                ? "Listening to your voice..."
                                : isTranscribing
                                  ? "Transcribing with OpenAI Whisper..."
                                  : isLoading
                                    ? "Analyzing PostgreSQL database..."
                                    : isPlayingAudio
                                      ? "Speaking answer..."
                                      : "Ready • Tap the microphone to talk"}
                        </span>
                    </div>

                    {/* Central Pulsing Audio Orb */}
                    <div className="z-10 flex flex-col items-center justify-center my-auto text-center space-y-6">
                        <div className="relative flex items-center justify-center">
                            {/* Animated Pulse Rings */}
                            {isRecording && (
                                <>
                                    <div className="absolute size-44 rounded-full bg-rose-500/20 animate-ping" />
                                    <div className="absolute size-56 rounded-full bg-rose-500/10 animate-pulse" />
                                </>
                            )}
                            {isPlayingAudio && (
                                <>
                                    <div className="absolute size-44 rounded-full bg-amber-400/20 animate-ping" />
                                    <div className="absolute size-56 rounded-full bg-amber-400/10 animate-pulse" />
                                </>
                            )}
                            {(isLoading || isTranscribing) && (
                                <div className="absolute size-48 rounded-full border-2 border-dashed border-blue-400/40 animate-spin" />
                            )}

                            {/* Main Interactive Button */}
                            <button
                                type="button"
                                onClick={
                                    isRecording ? stopRecording : startRecording
                                }
                                disabled={isLoading || isTranscribing}
                                className={cn(
                                    "relative size-32 sm:size-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95",
                                    isRecording
                                        ? "bg-rose-600 hover:bg-rose-500 text-white scale-105 ring-4 ring-rose-400/50"
                                        : isPlayingAudio
                                          ? "bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 scale-105 ring-4 ring-amber-300/50"
                                          : "bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white ring-4 ring-amber-500/20",
                                )}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="size-10 fill-current mb-1" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            Tap to Stop
                                        </span>
                                    </>
                                ) : isTranscribing || isLoading ? (
                                    <>
                                        <Loader2 className="size-10 animate-spin mb-1" />
                                        <span className="text-[11px] font-bold tracking-wider">
                                            Thinking...
                                        </span>
                                    </>
                                ) : isPlayingAudio ? (
                                    <>
                                        <Volume2 className="size-10 animate-bounce mb-1" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            Speaking
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Mic className="size-12 mb-1" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            Tap & Speak
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Spoken Query & Spoken Answer Transcript Card */}
                        <div className="max-w-xl mx-auto space-y-3 px-4">
                            {latestUserMsg && (
                                <div className="text-xs text-slate-400 font-medium">
                                    You asked:{" "}
                                    <span className="text-slate-200 font-semibold italic">
                                        "{latestUserMsg.content}"
                                    </span>
                                </div>
                            )}

                            {latestAssistantMsg && (
                                <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-sm text-slate-100 border border-white/10 text-left space-y-2 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                            <Bot className="size-3.5" />
                                            AI Voice Answer
                                        </span>
                                        {latestAssistantMsg.audioBase64 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    isPlayingAudio
                                                        ? stopAudio()
                                                        : playAudio(
                                                              latestAssistantMsg.audioBase64,
                                                              latestAssistantMsg.id,
                                                          )
                                                }
                                                className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-white transition-colors"
                                            >
                                                {isPlayingAudio ? (
                                                    <>
                                                        <Square className="size-3 fill-current" />
                                                        Stop voice
                                                    </>
                                                ) : (
                                                    <>
                                                        <Volume2 className="size-3" />
                                                        Replay voice
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-sm font-normal text-slate-100 leading-relaxed whitespace-pre-wrap">
                                        {latestAssistantMsg.content}
                                    </div>

                                    {/* Executed SQL query toggle in Voice Mode */}
                                    {latestAssistantMsg.sqlQuery && (
                                        <div className="pt-2 border-t border-white/10 text-xs">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSql(
                                                        latestAssistantMsg.id,
                                                    )
                                                }
                                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono"
                                            >
                                                <Terminal className="size-3" />
                                                <span>
                                                    {expandedSqlIds[
                                                        latestAssistantMsg.id
                                                    ]
                                                        ? "Hide SQL Query"
                                                        : "View Executed SQL Query"}
                                                </span>
                                                {typeof latestAssistantMsg.rowCount ===
                                                    "number" && (
                                                    <span className="text-slate-500">
                                                        (
                                                        {
                                                            latestAssistantMsg.rowCount
                                                        }{" "}
                                                        rows)
                                                    </span>
                                                )}
                                            </button>
                                            {expandedSqlIds[
                                                latestAssistantMsg.id
                                            ] && (
                                                <pre className="mt-2 rounded bg-black/60 p-2 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                                    {
                                                        latestAssistantMsg.sqlQuery
                                                    }
                                                </pre>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Voice Hint */}
                    <div className="z-10 text-xs text-slate-400 flex items-center gap-2">
                        <span>
                            Ask in English: "How many bottles were sold?",
                            "Today's sales", "Low ingredients"
                        </span>
                    </div>
                </div>
            ) : (
                /* TRANSCRIPT CHAT VIEW: Traditional chat log with audio replay */
                <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-4 shadow-inner">
                    {messages.map(msg => {
                        const isUser = msg.role === "user";
                        const isWelcome = msg.id === "welcome";
                        const isThisPlaying =
                            isPlayingAudio && playingMessageId === msg.id;

                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3",
                                    isUser ? "justify-end" : "justify-start",
                                )}
                            >
                                {!isUser && (
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs">
                                        <Bot className="size-5" />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "max-w-2xl rounded-2xl px-4 py-3 text-sm shadow-xs",
                                        isUser
                                            ? "bg-slate-900 text-white rounded-tr-none"
                                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none",
                                    )}
                                >
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>

                                    {/* Audio Playback Pill for Assistant Messages */}
                                    {!isUser &&
                                        !isWelcome &&
                                        msg.audioBase64 && (
                                            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isThisPlaying) {
                                                            stopAudio();
                                                        } else {
                                                            playAudio(
                                                                msg.audioBase64,
                                                                msg.id,
                                                            );
                                                        }
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
                                                        isThisPlaying
                                                            ? "bg-amber-500 text-white shadow-xs"
                                                            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
                                                    )}
                                                >
                                                    {isThisPlaying ? (
                                                        <>
                                                            <Square className="size-3 fill-current" />
                                                            <span>
                                                                Playing...
                                                                (Stop)
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Volume2 className="size-3 text-amber-600" />
                                                            <span>
                                                                Listen Spoken
                                                                Audio
                                                            </span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                    {/* Generated SQL Query Accordion for Assistant */}
                                    {!isUser && !isWelcome && msg.sqlQuery && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSql(msg.id)
                                                }
                                                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                            >
                                                <Terminal className="size-3" />
                                                <span>
                                                    {expandedSqlIds[msg.id]
                                                        ? "Hide executed SQL query"
                                                        : "View executed SQL query"}
                                                </span>
                                                {typeof msg.rowCount ===
                                                    "number" && (
                                                    <span className="text-[10px] text-slate-400">
                                                        ({msg.rowCount} rows
                                                        returned)
                                                    </span>
                                                )}
                                                {expandedSqlIds[msg.id] ? (
                                                    <ChevronUp className="size-3 ml-0.5" />
                                                ) : (
                                                    <ChevronDown className="size-3 ml-0.5" />
                                                )}
                                            </button>

                                            {expandedSqlIds[msg.id] && (
                                                <div className="relative mt-2 rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
                                                    <pre className="pr-12 whitespace-pre-wrap">
                                                        {msg.sqlQuery}
                                                    </pre>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                msg.sqlQuery!,
                                                                msg.id,
                                                            )
                                                        }
                                                        className="absolute top-2.5 right-2.5 rounded bg-slate-800 p-1 text-slate-400 hover:text-white"
                                                        title="Copy SQL"
                                                    >
                                                        {copiedId === msg.id ? (
                                                            <Check className="size-3.5 text-emerald-400" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={cn(
                                            "mt-1 text-[10px]",
                                            isUser
                                                ? "text-slate-400 text-right"
                                                : "text-slate-400",
                                        )}
                                    >
                                        {new Date(
                                            msg.timestamp,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>

                                {isUser && (
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs shadow-xs">
                                        You
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex gap-3 justify-start items-center">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                <Bot className="size-5" />
                            </div>
                            <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-xs flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin text-amber-600" />
                                <span>Analyzing database records...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Bottom Input Bar with Dedicated Voice Button */}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    handleSend();
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-xs focus-within:border-slate-500 transition-colors"
            >
                {/* Microphone Button */}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isTranscribing}
                    className={cn(
                        "size-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        isRecording
                            ? "bg-rose-600 text-white animate-pulse ring-2 ring-rose-400"
                            : isTranscribing
                              ? "bg-amber-100 text-amber-700"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
                    )}
                    title={
                        isRecording
                            ? "Recording voice... Click to send"
                            : "Click to speak via OpenAI Whisper"
                    }
                >
                    {isRecording ? (
                        <Square className="size-4 fill-current" />
                    ) : isTranscribing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Mic className="size-5 text-amber-600" />
                    )}
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={
                        isRecording
                            ? "Listening to your voice..."
                            : isTranscribing
                              ? "Transcribing your speech with Whisper..."
                              : "Speak or type your question in English..."
                    }
                    className="flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                    disabled={isLoading || isRecording || isTranscribing}
                />

                <Button
                    type="submit"
                    disabled={
                        !input.trim() ||
                        isLoading ||
                        isRecording ||
                        isTranscribing
                    }
                    className="h-10 px-4 gap-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-xs hover:bg-black disabled:opacity-50"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Send className="size-4" />
                    )}
                    <span>Send</span>
                </Button>
            </form>
        </div>
    );
}

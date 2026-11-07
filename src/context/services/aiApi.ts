import { api } from "./index";

export type ChatMessage = {
    role: "user" | "assistant";
    content: string;
};

export type ChatRequest = {
    message: string;
    history?: ChatMessage[];
    branchId?: string;
    engine?: "sql" | "tools";
    voiceResponse?: boolean;
    voice?: string;
};

export type ChatResponse = {
    reply: string;
    sqlQuery?: string;
    rowCount?: number;
    audioBase64?: string;
};

export type TranscribeRequest = {
    audioBase64: string;
    mimeType?: string;
};

export type TranscribeResponse = {
    text: string;
};

export type SpeakRequest = {
    text: string;
    voice?: string;
};

export type SpeakResponse = {
    audioBase64: string;
};

export const aiApi = api.injectEndpoints({
    overrideExisting: true,
    endpoints: builder => ({
        askAi: builder.mutation<ChatResponse, ChatRequest>({
            query: body => ({
                url: "/ai/chat",
                method: "POST",
                body,
            }),
        }),
        transcribeAudio: builder.mutation<
            TranscribeResponse,
            TranscribeRequest
        >({
            query: body => ({
                url: "/ai/transcribe",
                method: "POST",
                body,
            }),
        }),
        speakText: builder.mutation<SpeakResponse, SpeakRequest>({
            query: body => ({
                url: "/ai/speak",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useAskAiMutation,
    useTranscribeAudioMutation,
    useSpeakTextMutation,
} = aiApi;

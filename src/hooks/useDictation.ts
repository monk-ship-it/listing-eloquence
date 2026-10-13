import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeAudio } from "@/lib/transcribe.functions";

export type DictationStatus = "idle" | "listening" | "processing" | "error";

// Minimal typings for the Web Speech API (not in standard lib DOM types).
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

const MAX_RECORDING_MS = 3 * 60 * 1000;
const FATAL_SPEECH_ERRORS = new Set([
  "service-not-allowed",
  "network",
  "audio-capture",
  "language-not-supported",
]);
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/mp4", "audio/aac", "audio/webm"];

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function recorderAvailable() {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined"
  );
}

/** Live Web Speech only on desktop Chrome/Edge; everything else records. */
function canUseLiveSpeech() {
  if (typeof navigator === "undefined" || !getRecognitionCtor()) return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inApp = /; wv\)|FBAN|FBAV|Instagram|LinkedInApp|GSA\//.test(ua);
  const touch = navigator.maxTouchPoints > 0 || /Android|Mobi/i.test(ua);
  const chromium = /Chrome\/|Edg\//.test(ua) && !/OPR\/|Firefox/.test(ua);
  return chromium && !iOS && !inApp && !touch;
}

function friendlyServerError(msg: string) {
  if (msg.includes("NO_SPEECH")) return "No speech was detected — please try again.";
  if (msg.includes("RECORDING_TOO_LARGE")) return "That recording is too long. Try a shorter note.";
  if (msg.includes("TRANSCRIPTION_CREDITS"))
    return "Transcription is unavailable right now (out of credits). Please type your notes.";
  if (msg.includes("TRANSCRIPTION_RATE_LIMIT"))
    return "Too many requests — please wait a moment and try again.";
  if (msg.includes("TRANSCRIPTION_DAILY_LIMIT"))
    return "You've reached today's dictation limit. Please type your notes.";
  if (msg.includes("SUBSCRIPTION_REQUIRED")) return "An active plan is needed to dictate.";
  return "Transcription failed — please try again or type your notes.";
}

const MIC_DENIED =
  "Microphone access was blocked. Enable it for this site in your browser or device settings, then try again.";

export function useDictation(
  onResult: (text: string) => void,
  lang?: string,
  onStatus?: (status: DictationStatus, error: string | null) => void,
) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const transcribe = useServerFn(transcribeAudio);

  const onResultRef = useRef(onResult);
  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  }, [onStatus]);
  const errorRef = useRef<string | null>(null);
  const langRef = useRef(lang || "en-GB");
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    langRef.current = lang || "en-GB";
  }, [lang]);

  useEffect(() => {
    setSupported(recorderAvailable() || !!getRecognitionCtor());
  }, []);

  const statusRef = useRef<DictationStatus>("idle");
  const setStat = (s: DictationStatus) => {
    statusRef.current = s;
    setStatus(s);
    onStatusRef.current?.(s, s === "error" ? errorRef.current : null);
  };

  // Engine A state
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const lastCommittedRef = useRef("");
  // Engine B state
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const fail = (msg: string) => {
    errorRef.current = msg;
    setError(msg);
    setStat("error");
  };

  const startRecorder = useCallback(() => {
    if (!recorderAvailable()) {
      fail("Voice dictation isn't supported in this browser — type your notes instead.");
      return;
    }
    cancelledRef.current = false;
    setError(null);
    // Called synchronously from the tap so iOS keeps the user gesture.
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      (stream) => {
        streamRef.current = stream;
        const mimeType = MIME_CANDIDATES.find(
          (m) =>
            typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m),
        );
        let rec: MediaRecorder;
        try {
          rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch {
          releaseMic();
          fail("Couldn't start recording — please try again.");
          return;
        }
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        rec.onstop = async () => {
          recorderRef.current = null;
          releaseMic();
          if (cancelledRef.current) {
            setStat("idle");
            return;
          }
          const type = (rec.mimeType || mimeType || "audio/webm").split(";")[0];
          const blob = new Blob(chunks, { type });
          if (!blob.size) {
            fail("No speech was detected — please try again.");
            return;
          }
          if (blob.size > 10 * 1024 * 1024) {
            fail("That recording is too long. Try a shorter note.");
            return;
          }
          setStat("processing");
          const ext = type.includes("mp4") || type.includes("aac") ? "m4a" : "webm";
          const fd = new FormData();
          fd.append("audio", new File([blob], `voice-note.${ext}`, { type }));
          fd.append("lang", langRef.current);
          try {
            const res = await transcribe({ data: fd });
            if (cancelledRef.current) return;
            const text = res?.text?.trim();
            if (!text) {
              fail("No speech was detected — please try again.");
              return;
            }
            onResultRef.current(text);
            setStat("idle");
          } catch (e) {
            if (cancelledRef.current) return;
            fail(friendlyServerError(e instanceof Error ? e.message : String(e)));
          }
        };
        recorderRef.current = rec;
        rec.start(1000);
        setStat("listening");
        timerRef.current = window.setTimeout(() => {
          if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        }, MAX_RECORDING_MS);
      },
      (err: unknown) => {
        const name = (err as { name?: string })?.name;
        fail(
          name === "NotAllowedError" || name === "SecurityError"
            ? MIC_DENIED
            : name === "NotFoundError"
              ? "No microphone was found on this device."
              : "Couldn't access the microphone — please try again.",
        );
      },
    );
  }, [transcribe]);

  const startLive = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return startRecorder();
    setError(null);
    wantListeningRef.current = true;
    lastCommittedRef.current = "";

    const launch = () => {
      const r = new Ctor();
      r.lang = langRef.current;
      r.continuous = false;
      r.interimResults = true;
      recognitionRef.current = r;
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (!result.isFinal) continue;
          const text = result[0].transcript.trim();
          if (!text) continue;
          const norm = text.toLowerCase();
          if (norm === lastCommittedRef.current) continue;
          lastCommittedRef.current = norm;
          onResultRef.current(text);
        }
      };
      r.onerror = (e) => {
        if (FATAL_SPEECH_ERRORS.has(e.error)) {
          wantListeningRef.current = false;
          recognitionRef.current = null;
          // Fall back to the recorder engine.
          startRecorder();
          return;
        }
        if (e.error === "not-allowed") {
          wantListeningRef.current = false;
          fail(MIC_DENIED);
        }
        // no-speech / aborted: onend restarts while the user hasn't tapped Stop.
      };
      r.onend = () => {
        if (wantListeningRef.current && recognitionRef.current === r) {
          try {
            launch();
            return;
          } catch {
            /* fall through */
          }
        }
        if (recognitionRef.current === r) recognitionRef.current = null;
        if (statusRef.current === "listening" && !recorderRef.current) setStat("idle");
      };
      r.start();
    };

    try {
      launch();
      setStat("listening");
    } catch {
      wantListeningRef.current = false;
      startRecorder();
    }
  }, [startRecorder]);

  const start = useCallback(() => {
    if (statusRef.current === "listening" || statusRef.current === "processing") return;
    if (canUseLiveSpeech()) startLive();
    else startRecorder();
  }, [startLive, startRecorder]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else if (!recognitionRef.current && statusRef.current === "listening") {
      setStat("idle");
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    wantListeningRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    releaseMic();
    setError(null);
    setStat("idle");
  }, []);

  const toggle = useCallback(() => {
    if (statusRef.current === "listening") stop();
    else start();
  }, [start, stop]);

  // Stop recording when the page is hidden (tab switch, app backgrounded).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden" && statusRef.current === "listening") stop();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stop]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    status,
    error,
    supported,
    recording: status === "listening",
    busy: status === "processing",
    toggle,
    start,
    stop,
    cancel,
  };
}

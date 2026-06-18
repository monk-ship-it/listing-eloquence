import { useCallback, useEffect, useRef, useState } from "react";

export type DictationStatus = "idle" | "listening" | "error";

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

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Microphone dictation using the browser's built-in Web Speech API.
 * No server calls, no transcription credits — recognition runs on-device /
 * via the browser. Final recognized phrases are sent through onResult.
 */
export function useDictation(onResult: (text: string) => void, lang?: string) {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cancelledRef = useRef(false);
  const supported = !!getRecognitionCtor();

  // Keep latest onResult without re-creating the recognition instance.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recognitionRef.current?.abort();
    setStatus("idle");
    setError(null);
  }, []);

  const start = useCallback(() => {
    if (status === "listening") return;
    setError(null);

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setStatus("error");
      setError("Voice dictation isn't supported in this browser. Try Chrome.");
      return;
    }

    cancelledRef.current = false;
    const recognition = new Ctor();
    recognition.lang = lang || "en-GB";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) onResultRef.current(text);
        }
      }
    };

    recognition.onerror = (e) => {
      if (cancelledRef.current) return;
      setStatus("error");
      setError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone access is needed to dictate."
          : e.error === "no-speech"
            ? "Didn't catch that — please try again."
            : "Dictation stopped unexpectedly.",
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    try {
      recognition.start();
      setStatus("listening");
    } catch {
      setStatus("error");
      setError("Couldn't start dictation — please try again.");
    }
  }, [status]);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else start();
  }, [status, start, stop]);

  // Stop recognition if the component unmounts mid-session.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    status,
    error,
    supported,
    recording: status === "listening",
    busy: false,
    toggle,
    start,
    stop,
    cancel,
  };
}

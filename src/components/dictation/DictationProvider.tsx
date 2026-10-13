import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useDictation, type DictationStatus } from "@/hooks/useDictation";
import { useDictationSettings, type LanguageCode, LANGUAGES } from "@/hooks/useDictationSettings";
import { applyDictation, normaliseFieldValue, type DictateMode } from "@/lib/listing-fields";

export interface DictationSink {
  get: () => string;
  set: (value: string) => void;
}

interface Session {
  key: string;
  label: string;
  sink: DictationSink;
  mode: DictateMode;
  /** Raw text accumulated this session (replace mode). */
  raw: string;
  /** Value before the first phrase, for Undo in replace mode. */
  prev: string | null;
}

interface DictationContextValue {
  supported: boolean;
  status: DictationStatus;
  error: string | null;
  /** Field currently listening/processing, or null. */
  activeKey: string | null;
  /** Field whose last session ended in an error. */
  errorKey: string | null;
  /** Key of the most recent session that finished successfully. */
  lastFinishedKey: string | null;
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  languages: typeof LANGUAGES;
  /** Start (or stop, if this field is the active one). Must be called from a tap. */
  toggle: (key: string, label: string, sink: DictationSink, mode: DictateMode) => void;
  stop: () => void;
  /** Stops any recording and resolves once its transcript has landed. */
  finishPending: () => Promise<void>;
  clearLastFinished: () => void;
}

const DictationContext = createContext<DictationContextValue | null>(null);

export function useDictationContext(): DictationContextValue {
  const ctx = useContext(DictationContext);
  if (!ctx) throw new Error("useDictationContext must be used inside DictationProvider");
  return ctx;
}

/**
 * Owns ONE dictation engine for the whole page. The target field (sink) is
 * captured when recording starts, so a slow transcript always lands in the
 * field that was tapped. Only one field records at a time.
 */
export function DictationProvider({ children }: { children: ReactNode }) {
  const { lang, setLang, languages } = useDictationSettings();
  const sessionRef = useRef<Session | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [lastFinishedKey, setLastFinishedKey] = useState<string | null>(null);
  const waitersRef = useRef<(() => void)[]>([]);
  const busyRef = useRef(false);

  const onResult = useCallback((text: string) => {
    const s = sessionRef.current;
    if (!s) return;
    if (s.mode === "replace") {
      if (s.prev === null) s.prev = s.sink.get();
      s.raw = s.raw ? `${s.raw} ${text}` : text;
      const next = normaliseFieldValue(s.key, s.raw);
      if (next === null) {
        toast.info(`Didn't catch a ${s.label.toLowerCase()} option — please choose it.`, {
          id: `dictate-${s.key}`,
        });
        return;
      }
      s.sink.set(next);
      const prev = s.prev;
      const sink = s.sink;
      toast.success(`${s.label}: ${next}`, {
        id: `dictate-${s.key}`,
        action: prev !== next ? { label: "Undo", onClick: () => sink.set(prev) } : undefined,
      });
    } else {
      s.sink.set(applyDictation(s.mode, s.sink.get(), text));
    }
  }, []);

  const onStatus = useCallback((status: DictationStatus, error: string | null) => {
    if (status === "listening" || status === "processing") {
      busyRef.current = true;
      return;
    }
    busyRef.current = false;
    const s = sessionRef.current;
    sessionRef.current = null;
    setActiveKey(null);
    if (s) {
      if (status === "error") {
        setErrorKey(s.key);
        if (s.key !== "voiceNotes" && error) toast.error(error);
      } else {
        setErrorKey(null);
        setLastFinishedKey(s.key);
      }
    }
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((w) => w());
  }, []);

  const engine = useDictation(onResult, lang, onStatus);

  const toggle = useCallback(
    (key: string, label: string, sink: DictationSink, mode: DictateMode) => {
      const s = sessionRef.current;
      if (s) {
        // Tapping the active mic stops it; other mics are ignored while busy.
        if (s.key === key && engine.status === "listening") engine.stop();
        return;
      }
      sessionRef.current = { key, label, sink, mode, raw: "", prev: null };
      setActiveKey(key);
      setErrorKey(null);
      setLastFinishedKey(null);
      busyRef.current = true;
      // Synchronous inside the tap handler so iOS keeps the user gesture.
      engine.start();
    },
    [engine],
  );

  const finishPending = useCallback((): Promise<void> => {
    if (!sessionRef.current && !busyRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 30_000);
      waitersRef.current.push(() => {
        window.clearTimeout(timeout);
        resolve();
      });
      engine.stop();
    });
  }, [engine]);

  const value = useMemo<DictationContextValue>(
    () => ({
      supported: engine.supported,
      status: engine.status,
      error: engine.error,
      activeKey,
      errorKey,
      lastFinishedKey,
      lang,
      setLang,
      languages,
      toggle,
      stop: engine.stop,
      finishPending,
      clearLastFinished: () => setLastFinishedKey(null),
    }),
    [engine, activeKey, errorKey, lastFinishedKey, lang, setLang, languages, toggle, finishPending],
  );

  return <DictationContext.Provider value={value}>{children}</DictationContext.Provider>;
}

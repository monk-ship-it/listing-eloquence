import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "dictation-language";

export const LANGUAGES = [
  { label: "English (UK)", code: "en-GB" },
  { label: "English (US)", code: "en-US" },
  { label: "English (Australia)", code: "en-AU" },
  { label: "Spanish", code: "es-ES" },
  { label: "French", code: "fr-FR" },
  { label: "German", code: "de-DE" },
  { label: "Italian", code: "it-IT" },
  { label: "Portuguese", code: "pt-PT" },
  { label: "Dutch", code: "nl-NL" },
  { label: "Polish", code: "pl-PL" },
  { label: "Swedish", code: "sv-SE" },
  { label: "Danish", code: "da-DK" },
  { label: "Norwegian", code: "no-NO" },
  { label: "Finnish", code: "fi-FI" },
  { label: "Russian", code: "ru-RU" },
  { label: "Turkish", code: "tr-TR" },
  { label: "Arabic", code: "ar-SA" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Japanese", code: "ja-JP" },
  { label: "Korean", code: "ko-KR" },
  { label: "Chinese (Simplified)", code: "zh-CN" },
  { label: "Chinese (Traditional)", code: "zh-TW" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

// Shared module-level store so every mic and the language picker agree.
let currentLang: LanguageCode = "en-GB";
let loaded = false;
const listeners = new Set<() => void>();

function loadOnce() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const exists = LANGUAGES.find((l) => l.code === stored);
    if (exists) currentLang = exists.code;
  } catch {
    // storage unavailable (private mode etc.) — keep default
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setDictationLang(code: LanguageCode) {
  currentLang = code;
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useDictationSettings() {
  const lang = useSyncExternalStore(
    subscribe,
    () => currentLang,
    () => "en-GB" as LanguageCode,
  );

  useEffect(() => {
    if (!loaded) {
      loadOnce();
      listeners.forEach((l) => l());
    }
  }, []);

  return { lang, setLang: setDictationLang, languages: LANGUAGES };
}

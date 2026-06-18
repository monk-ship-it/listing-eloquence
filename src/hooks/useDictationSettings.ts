import { useState, useEffect } from "react";

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

export function useDictationSettings() {
  const [lang, setLang] = useState<LanguageCode>("en-GB");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const exists = LANGUAGES.find((l) => l.code === stored);
      if (exists) setLang(exists.code as LanguageCode);
    }
  }, []);

  const saveLang = (code: LanguageCode) => {
    setLang(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  };

  return { lang, setLang: saveLang, languages: LANGUAGES };
}

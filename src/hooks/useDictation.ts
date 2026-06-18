import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeAudio } from "@/lib/transcribe.functions";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:...;base64," prefix
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export type DictationStatus = "idle" | "listening" | "processing" | "error";

/**
 * Microphone dictation hook. Records audio, transcribes it via the server,
 * and returns the text through onResult. Exposes status, error, and a
 * cancel control that discards the current recording/transcription.
 */
export function useDictation(onResult: (text: string) => void) {
  const transcribe = useServerFn(transcribeAudio);
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Stop recording and transcribe what was captured.
  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  // Discard the current recording or ignore an in-flight transcription.
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    cleanupStream();
    setStatus("idle");
    setError(null);
  }, [cleanupStream]);

  const start = useCallback(async () => {
    if (status === "listening" || status === "processing") return;
    setError(null);
    cancelledRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("error");
      setError("Microphone access is needed to dictate.");
      return;
    }

    const mimeType = ["audio/webm", "audio/mp4"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
    );
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      setStatus("error");
      setError("This browser can't record a supported audio format.");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      cleanupStream();
      if (cancelledRef.current) {
        setStatus("idle");
        return;
      }

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      if (blob.size < 1024) {
        setStatus("error");
        setError("That recording was empty — please try again.");
        return;
      }

      setStatus("processing");
      try {
        const audio = await blobToBase64(blob);
        const { text } = await transcribe({ data: { audio, mimeType: recorder.mimeType } });
        if (cancelledRef.current) {
          setStatus("idle");
          return;
        }
        if (text) {
          onResult(text);
          setStatus("idle");
        } else {
          setStatus("error");
          setError("Couldn't hear anything — please try again.");
        }
      } catch (err) {
        if (cancelledRef.current) {
          setStatus("idle");
          return;
        }
        setStatus("error");
        setError(err instanceof Error ? err.message : "Transcription failed.");
      }
    };

    recorder.start();
    setStatus("listening");
  }, [status, transcribe, onResult, cleanupStream]);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else if (status !== "processing") start();
  }, [status, start, stop]);

  return {
    status,
    error,
    recording: status === "listening",
    busy: status === "processing",
    toggle,
    start,
    stop,
    cancel,
  };
}

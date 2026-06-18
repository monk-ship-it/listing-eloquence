import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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

/**
 * Microphone dictation hook. Records audio, transcribes it via the server,
 * and returns the text through onResult.
 */
export function useDictation(onResult: (text: string) => void) {
  const transcribe = useServerFn(transcribeAudio);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    if (recording || busy) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access is needed to dictate.");
      return;
    }
    const mimeType = ["audio/webm", "audio/mp4"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t),
    );
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      toast.error("This browser can't record a supported audio format.");
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
      setRecording(false);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      if (blob.size < 1024) {
        toast.error("That recording was empty — please try again.");
        return;
      }
      setBusy(true);
      try {
        const audio = await blobToBase64(blob);
        const { text } = await transcribe({ data: { audio, mimeType: recorder.mimeType } });
        if (text) {
          onResult(text);
        } else {
          toast.error("Couldn't hear anything — please try again.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Transcription failed.");
      } finally {
        setBusy(false);
      }
    };

    recorder.start();
    setRecording(true);
  }, [recording, busy, transcribe, onResult]);

  const toggle = useCallback(() => {
    if (recording) stop();
    else start();
  }, [recording, start, stop]);

  return { recording, busy, toggle };
}

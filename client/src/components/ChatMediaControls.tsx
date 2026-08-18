import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, Square, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getMediaDuration, uploadChatMedia, type ChatMediaKind, type UploadedChatMedia } from "@/lib/chat-media";

interface ChatMediaControlsProps {
  onSendMedia: (kind: ChatMediaKind, media: UploadedChatMedia) => Promise<void>;
  disabled?: boolean;
  videoMaxSeconds?: number;
}

function supportedMimeType(kind: "audio" | "video") {
  const candidates = kind === "audio"
    ? ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
    : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"];
  return candidates.find((mime) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) || "";
}

export default function ChatMediaControls({ onSendMedia, disabled = false, videoMaxSeconds = 90 }: ChatMediaControlsProps) {
  const [recording, setRecording] = useState<"audio" | "video" | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const clearRecording = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(null);
    setRecordingSeconds(0);
  };

  useEffect(() => () => clearRecording(), []);

  const uploadFile = async (file: File, kind: ChatMediaKind) => {
    try {
      setUploading(true);
      const duration = kind === "image" ? 0 : await getMediaDuration(file);
      const media = await uploadChatMedia(file, kind, duration);
      await onSendMedia(kind, media);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async (kind: "audio" | "video") => {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      (kind === "video" ? videoInputRef : audioInputRef).current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === "audio" ? { audio: true } : { audio: true, video: true });
      const mimeType = supportedMimeType(kind);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const duration = recordingSeconds;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || (kind === "audio" ? "audio/webm" : "video/webm") });
        const extension = kind === "audio" ? "webm" : "webm";
        const file = new File([blob], `avalyarin-${kind}-${Date.now()}.${extension}`, { type: blob.type });
        clearRecording();
        await uploadFile(file, kind);
        void duration;
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start(250);
      setRecording(kind);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((current) => {
          const next = current + 1;
          const max = kind === "video" ? videoMaxSeconds : 180;
          if (next >= max) recorder.stop();
          return next;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error?.name === "NotAllowedError" ? "Permita o acesso ao microfone/câmera para gravar." : "Não foi possível iniciar a gravação.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const handleInput = async (event: React.ChangeEvent<HTMLInputElement>, kind: ChatMediaKind) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await uploadFile(file, kind);
  };

  const isBusy = disabled || uploading;
  return (
    <div className="flex items-center gap-1">
      <input ref={imageInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void handleInput(event, "image")} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(event) => void handleInput(event, "video")} />
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(event) => void handleInput(event, "audio")} />
      {recording ? (
        <Button type="button" size="sm" variant="outline" onClick={stopRecording} disabled={uploading} className="border-red-400/50 text-red-300 gap-1" title="Parar gravação">
          <Square className="w-3.5 h-3.5 fill-current" /> {recordingSeconds}s
        </Button>
      ) : (
        <>
          <Button type="button" size="icon" variant="ghost" onClick={() => void startRecording("audio")} disabled={isBusy} title="Gravar áudio">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => imageInputRef.current?.click()} disabled={isBusy} title="Enviar ou tirar foto">
            <Camera className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => void startRecording("video")} disabled={isBusy} title={`Gravar vídeo de até ${videoMaxSeconds} segundos`}>
            <Video className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}

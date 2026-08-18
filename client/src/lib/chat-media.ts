export type ChatMediaKind = "audio" | "image" | "video";

export type UploadedChatMedia = {
  url: string;
  key: string;
  mimeType: string;
  durationSeconds: number | null;
  sizeBytes: number;
};

const LIMITS: Record<ChatMediaKind, { maxBytes: number; maxDuration: number }> = {
  audio: { maxBytes: 15 * 1024 * 1024, maxDuration: 180 },
  image: { maxBytes: 12 * 1024 * 1024, maxDuration: 0 },
  video: { maxBytes: 60 * 1024 * 1024, maxDuration: 90 },
};

export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
      resolve(0);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const media = document.createElement(file.type.startsWith("audio/") ? "audio" : "video");
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(media.duration) ? media.duration : 0);
    };
    media.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler a duração do arquivo."));
    };
    media.src = objectUrl;
  });
}

export async function uploadChatMedia(file: File, kind: ChatMediaKind, durationSeconds = 0): Promise<UploadedChatMedia> {
  const limits = LIMITS[kind];
  if (file.size > limits.maxBytes) {
    throw new Error(`O arquivo excede o limite de ${Math.round(limits.maxBytes / 1024 / 1024)} MB.`);
  }
  if (limits.maxDuration > 0 && durationSeconds > limits.maxDuration + 0.5) {
    throw new Error(`A duração máxima é de ${limits.maxDuration} segundos.`);
  }

  const response = await fetch("/api/upload-chat-media", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-Media-Type": kind,
      "X-Media-Duration": String(Math.round(durationSeconds)),
      "X-File-Name": file.name,
    },
    body: file,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a mídia.");
  return payload as UploadedChatMedia;
}

export async function uploadRatingMedia(file: File, kind: "image" | "video", durationSeconds = 0): Promise<UploadedChatMedia> {
  if (kind === "video" && durationSeconds > 60.5) throw new Error("Vídeos de avaliações devem ter até 60 segundos.");
  if (file.size > (kind === "video" ? 60 : 12) * 1024 * 1024) throw new Error("O arquivo excede o limite permitido.");
  const response = await fetch("/api/upload-rating-media", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-Media-Type": kind,
      "X-Media-Duration": String(Math.round(durationSeconds)),
      "X-File-Name": file.name,
    },
    body: file,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Não foi possível enviar a mídia da avaliação.");
  return payload as UploadedChatMedia;
}

export function formatMediaDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "00:00";
  const total = Math.round(seconds);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

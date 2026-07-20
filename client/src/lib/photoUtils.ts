import heic2any from "heic2any";

/**
 * Detect the mime type from a data URL
 */
export function getMimeFromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/webp")) return "image/webp";
  if (dataUrl.startsWith("data:image/png")) return "image/png";
  if (dataUrl.startsWith("data:image/heic")) return "image/heic";
  if (dataUrl.startsWith("data:image/heif")) return "image/heif";
  if (dataUrl.startsWith("data:image/avif")) return "image/avif";
  if (dataUrl.startsWith("data:image/gif")) return "image/gif";
  return "image/jpeg";
}

/**
 * Process a file from input: convert HEIC/HEIF to JPEG if needed,
 * then return a data URL ready for upload.
 */
export async function processPhotoFile(file: File): Promise<string> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");

  let processedFile: Blob = file;

  if (isHeic) {
    try {
      // Convert HEIC to JPEG
      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });
      processedFile = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn("[Photo] HEIC conversion failed, using original:", err);
      // Fall through to use original file
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) resolve(result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(processedFile);
  });
}

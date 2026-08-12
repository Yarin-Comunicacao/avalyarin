// Storage helpers - supports Manus Forge API (dev) and Cloudflare R2 (production)
import { ENV } from "./_core/env";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Detect which storage backend to use
function isR2Available(): boolean {
  return !!(ENV.r2AccountId && ENV.r2AccessKeyId && ENV.r2SecretAccessKey && ENV.r2BucketName);
}

function isForgeAvailable(): boolean {
  const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
  const forgeKey = ENV.forgeApiKey;
  return !!(forgeBaseUrl && forgeKey);
}

// R2 Client (lazy initialized)
let r2Client: S3Client | null = null;
function getR2Client(): S3Client {
  if (!r2Client) {
    const endpoint = ENV.r2Endpoint || `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`;
    r2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  }
  return r2Client;
}

// R2 Public URL
const R2_PUBLIC_URL = ENV.r2PublicUrl || "https://pub-bb18166d5e144b6ab0d3eaec567317d1.r2.dev";

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ==================== PUT ====================

async function storagePutR2(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(new PutObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return { key, url: `${R2_PUBLIC_URL}/${key}` };
}

async function storagePutForge(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
  const forgeKey = ENV.forgeApiKey;
  const key = appendHashSuffix(normalizeKey(relKey));

  const presignUrl = new URL("v1/storage/presign/put", forgeBaseUrl + "/");
  presignUrl.searchParams.set("path", key);
  presignUrl.searchParams.set("content_type", contentType);

  const presignResp = await fetch(presignUrl.toString(), {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const text = await presignResp.text();
    throw new Error(`Forge presign/put failed (${presignResp.status}): ${text}`);
  }

  const { url: uploadUrl } = (await presignResp.json()) as { url: string };
  const body = typeof data === "string" ? Buffer.from(data) : data;
  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: body as any,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload failed (${uploadResp.status})`);
  }

  return { key, url: `/storage/${key}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (isR2Available()) {
    return storagePutR2(relKey, data, contentType);
  }
  if (isForgeAvailable()) {
    return storagePutForge(relKey, data, contentType);
  }
  throw new Error("No storage backend configured: set R2 or Forge API credentials");
}

// ==================== GET ====================

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (isR2Available()) {
    return { key, url: `${R2_PUBLIC_URL}/${key}` };
  }
  return { key, url: `/storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string, expiresIn = 3600): Promise<string> {
  const key = normalizeKey(relKey);

  if (isR2Available()) {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  // Fallback to Forge
  const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
  const forgeKey = ENV.forgeApiKey;

  const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
  forgeUrl.searchParams.set("path", key);
  if (expiresIn !== 3600) {
    forgeUrl.searchParams.set("expires_in", String(expiresIn));
  }

  const resp = await fetch(forgeUrl.toString(), {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Forge presign/get failed (${resp.status}): ${text}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}

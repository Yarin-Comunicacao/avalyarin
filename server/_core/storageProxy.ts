// Storage proxy - serves files from Forge API (dev) or Cloudflare R2 (production)
import type { Express } from "express";
import { ENV } from "./env";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

// Lazy-initialized R2 client
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

// MIME type detection from file extension
function getMimeType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    pdf: "application/pdf",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
}

export function registerStorageProxy(app: Express) {
  const handler = async (req: any, res: any) => {
    const key = (req.params as any)[0] as string;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
    const forgeKey = ENV.forgeApiKey;

    // If Forge API is available (dev environment), use it
    if (forgeBaseUrl && forgeKey) {
      try {
        const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl.toString(), {
          headers: { Authorization: `Bearer ${forgeKey}` },
        });

        if (!forgeResp.ok) {
          console.error("[StorageProxy] Forge responded:", forgeResp.status);
          res.status(502).send("Storage backend error");
          return;
        }

        const { url } = (await forgeResp.json()) as { url: string };
        if (!url) {
          res.status(502).send("Empty signed URL");
          return;
        }

        res.set("Cache-Control", "private, max-age=3600");
        res.redirect(307, url);
      } catch (err) {
        console.error("[StorageProxy] Forge failed:", err);
        res.status(502).send("Storage proxy error");
      }
      return;
    }

    // If R2 is configured (production), fetch directly from bucket via S3 API
    if (ENV.r2AccountId && ENV.r2AccessKeyId && ENV.r2SecretAccessKey && ENV.r2BucketName) {
      try {
        const client = getR2Client();
        const command = new GetObjectCommand({
          Bucket: ENV.r2BucketName,
          Key: key,
        });

        const response = await client.send(command);

        if (!response.Body) {
          res.status(404).send("File not found");
          return;
        }

        const contentType = response.ContentType || getMimeType(key);
        res.set("Content-Type", contentType);
        res.set("Cache-Control", "public, max-age=86400, immutable");
        if (response.ContentLength) {
          res.set("Content-Length", String(response.ContentLength));
        }

        // Stream the response body to the client
        const stream = response.Body as Readable;
        stream.pipe(res);
      } catch (err: any) {
        if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
          res.status(404).send("File not found in storage");
        } else {
          console.error("[StorageProxy] R2 fetch failed:", err?.message || err);
          res.status(502).send("Storage error");
        }
      }
      return;
    }

    // No storage backend configured
    console.error("[StorageProxy] No storage backend configured");
    res.status(502).send("Storage not configured");
  };

  // Serve files from /storage/* path
  app.get("/storage/*", handler);
  // Keep /manus-storage/* for backward compatibility (dev environment)
  app.get("/manus-storage/*", handler);
}

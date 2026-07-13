// Storage proxy - serves files from Cloudflare R2 via presigned URLs
import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  const handler = async (req: any, res: any) => {
    const key = (req.params as any)[0] as string;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "private, max-age=3600");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };

  // Support both /storage/* (new) and /manus-storage/* (legacy) paths
  app.get("/storage/*", handler);
  app.get("/manus-storage/*", handler);
}

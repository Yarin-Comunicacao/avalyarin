import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerOwnAuthRoutes } from "../auth-own";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { sdk } from "./sdk";
import sharp from "sharp";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust proxy (required for Render, Railway, etc. behind reverse proxy)
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerOwnAuthRoutes(app);

  // File upload endpoint for age verification documents
  app.post("/api/upload/document", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "image/jpeg";
      const fileName = (req.headers["x-file-name"] as string) || `document-${Date.now()}.jpg`;
      const data = req.body as Buffer;
      if (!data || data.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }
      const key = `age-verification/${Date.now()}-${fileName}`;
      const result = await storagePut(key, data, contentType);
      return res.json({ url: result.url, key: result.key });
    } catch (error: any) {
      console.error("[Upload] Error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });
  // Chat media upload — raw binary for audio, images and short videos.
  // The client supplies duration metadata; limits are enforced again here.
  app.post("/api/upload-chat-media", express.raw({ type: "*/*", limit: "60mb" }), async (req, res) => {
    try {
      try { await sdk.authenticateRequest(req); } catch { return res.status(401).json({ error: "Login necessário para enviar mídia" }); }
      const mediaType = String(req.headers["x-media-type"] || "");
      const contentType = String(req.headers["content-type"] || "application/octet-stream");
      const durationHeader = Number(req.headers["x-media-duration"] || 0);
      const fileName = String(req.headers["x-file-name"] || `chat-${Date.now()}`)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 120);
      const data = req.body as Buffer;
      const allowedTypes: Record<string, string[]> = {
        audio: ["audio/", "video/webm", "video/mp4"],
        image: ["image/"],
        video: ["video/"],
      };
      const validMediaType = mediaType === "audio" || mediaType === "image" || mediaType === "video";
      const validContentType = validMediaType && allowedTypes[mediaType].some((prefix) => contentType.startsWith(prefix));
      const maxBytes = mediaType === "video" ? 60 * 1024 * 1024 : mediaType === "image" ? 12 * 1024 * 1024 : 15 * 1024 * 1024;
      const maxDuration = mediaType === "video" ? 90 : mediaType === "audio" ? 180 : 0;

      if (!data || data.length === 0) return res.status(400).json({ error: "Nenhum arquivo enviado" });
      if (!validContentType) return res.status(415).json({ error: "Formato de mídia não suportado" });
      if (data.length > maxBytes) return res.status(413).json({ error: "Arquivo maior que o limite permitido" });
      if (maxDuration > 0 && durationHeader > maxDuration + 1) {
        return res.status(422).json({ error: `A duração máxima é de ${maxDuration} segundos` });
      }

      const key = `chat-media/${mediaType}/${Date.now()}-${fileName}`;
      const result = await storagePut(key, data, contentType);
      return res.json({
        url: result.url,
        key: result.key,
        mimeType: contentType,
        durationSeconds: durationHeader || null,
        sizeBytes: data.length,
      });
    } catch (error: any) {
      console.error("[Chat Media Upload] Error:", error);
      return res.status(500).json({ error: "Não foi possível enviar a mídia" });
    }
  });

  // Rating media upload — images and videos up to 60 seconds.
  app.post("/api/upload-rating-media", express.raw({ type: "*/*", limit: "60mb" }), async (req, res) => {
    try {
      try { await sdk.authenticateRequest(req); } catch { return res.status(401).json({ error: "Login necessário para enviar mídia" }); }
      const mediaType = String(req.headers["x-media-type"] || "");
      const contentType = String(req.headers["content-type"] || "application/octet-stream");
      const durationHeader = Number(req.headers["x-media-duration"] || 0);
      const fileName = String(req.headers["x-file-name"] || `rating-${Date.now()}`)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 120);
      const  rawBody  =  req.body ;​​
      if  ( ! Buffer . isBuffer ( rawBody )  ||  rawBody . length  ===  0 )  retorna  res . estado ( 400 ) . json ( {  erro : "Nenhum arquivo enviado"  } ) ;
      const  data  =  rawBody ;
      const validType = mediaType === "image" || mediaType === "video";
      const validContentType = validType && (mediaType === "image" ? contentType.startsWith("image/") : contentType.startsWith("video/"));
      const maxBytes = mediaType === "video" ? 60 * 1024 * 1024 : 12 * 1024 * 1024;
      if (!validContentType) return res.status(415).json({ error: "Formato de mídia não suportado" });
      if (data.length > maxBytes) return res.status(413).json({ error: "Arquivo maior que o limite permitido" });
      if (mediaType === "video" && durationHeader > 61) return res.status(422).json({ error: "Vídeos de avaliações devem ter até 60 segundos" });
      const key = `ratings/media/${Date.now()}-${fileName}`;
      const result = await storagePut(key, data, contentType);
      return res.json({ url: result.url, key: result.key, mimeType: contentType, durationSeconds: durationHeader || null, sizeBytes: data.length });
    } catch (error: any) {
      console.error("[Rating Media Upload] Error:", error);
      return res.status(500).json({ error: "Não foi possível enviar a mídia da avaliação" });
    }
  });

  // Menu image upload endpoint — converts to WebP (thumbnail 400x400 + full 1200x1200)
  app.post("/api/upload-menu-image", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      const data = req.body as Buffer;
      if (!data || data.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }

      const timestamp = Date.now();
      const baseName = `menu-${timestamp}`;

      // Generate full version (1200x1200 max, WebP quality 80%)
      const fullBuffer = await sharp(data)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // Generate thumbnail version (400x400 max, WebP quality 70%)
      const thumbBuffer = await sharp(data)
        .resize(400, 400, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();

      // Upload both to S3
      const fullResult = await storagePut(
        `menu-images/${baseName}-full.webp`,
        fullBuffer,
        "image/webp"
      );
      const thumbResult = await storagePut(
        `menu-images/${baseName}-thumb.webp`,
        thumbBuffer,
        "image/webp"
      );

      return res.json({
        url: fullResult.url,
        key: fullResult.key,
        thumbUrl: thumbResult.url,
        thumbKey: thumbResult.key,
      });
    } catch (error: any) {
      console.error("[Menu Image Upload] Error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // Establishment logo upload endpoint — converts to WebP (500x500 square, 1:1)
  app.post("/api/upload-logo", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      const data = req.body as Buffer;
      if (!data || data.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }

      const timestamp = Date.now();
      const baseName = `logo-${timestamp}`;

      // Generate square logo (500x500, cover to ensure 1:1)
      const logoBuffer = await sharp(data)
        .resize(500, 500, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      // Upload to S3
      const result = await storagePut(
        `logos/${baseName}.webp`,
        logoBuffer,
        "image/webp"
      );

      return res.json({
        url: result.url,
        key: result.key,
      });
    } catch (error: any) {
      console.error("[Logo Upload] Error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // Establishment cover image upload endpoint — converts to WebP (1200x800)
  app.post("/api/upload-cover", express.raw({ type: "*/*", limit: "5mb" }), async (req, res) => {
    try {
      const data = req.body as Buffer;
      if (!data || data.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }

      const timestamp = Date.now();
      const baseName = `cover-${timestamp}`;

      // Generate cover image (1200x800 max)
      const coverBuffer = await sharp(data)
        .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to S3
      const result = await storagePut(
        `covers/${baseName}.webp`,
        coverBuffer,
        "image/webp"
      );

      return res.json({
        url: result.url,
        key: result.key,
      });
    } catch (error: any) {
      console.error("[Cover Upload] Error:", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // Heartbeat: expire old posts
  app.post("/api/scheduled/expire-posts", async (req, res) => {
    try {
      const { expireOldPosts } = await import("../db-posts");
      const count = await expireOldPosts();
      console.log(`[Heartbeat] Expired ${count} posts`);
      res.json({ ok: true, expired: count, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Heartbeat] expire-posts error:", error);
      res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    }
  });

  // Heartbeat: expire professional roles after 35 days without payment
  app.post("/api/scheduled/expire-roles", async (req, res) => {
    try {
      const { expireOverdueRoles } = await import("../db-plans");
      const result = await expireOverdueRoles();
      console.log(`[Heartbeat] Expired ${result.expired} professional roles`);
      res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Heartbeat] expire-roles error:", error);
      res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    }
  });

  // Heartbeat: expire business plans with progressive grace period (20/15/5 days)
  app.post("/api/scheduled/expire-business-plans", async (req, res) => {
    try {
      const { expireOverdueBusinessPlans } = await import("../db-plans");
      const result = await expireOverdueBusinessPlans();
      console.log(`[Heartbeat] Expired ${result.expired} business plans`);
      res.json({ ok: true, ...result, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("[Heartbeat] expire-business-plans error:", error);
      res.status(500).json({ error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    }
  });

  // Facebook Data Deletion Callback (required for Facebook OAuth compliance)
  // This endpoint handles data deletion requests from Facebook
  app.post("/api/facebook/data-deletion", async (req, res) => {
    try {
      // Facebook sends a signed_request with the user's Facebook ID
      const { signed_request } = req.body || {};
      
      // Generate a confirmation code for tracking
      const confirmationCode = `AVAL-DEL-${Date.now()}`;
      
      // Log the deletion request
      console.log(`[Facebook Data Deletion] Request received. Code: ${confirmationCode}`);
      
      // If we have a signed_request, we can decode the user ID
      if (signed_request) {
        try {
          // Decode the base64url payload (second part after the dot)
          const parts = signed_request.split(".");
          if (parts.length === 2) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
            const facebookUserId = payload.user_id;
            if (facebookUserId) {
              console.log(`[Facebook Data Deletion] User ID: ${facebookUserId}, Code: ${confirmationCode}`);
              // Mark user data for deletion (async, don't block response)
              // In production, this would trigger actual data cleanup
            }
          }
        } catch (decodeErr) {
          console.warn("[Facebook Data Deletion] Could not decode signed_request");
        }
      }

      // Facebook expects this exact JSON response format
      return res.json({
        url: `https://avalyarin.com.br/privacidade?deletion=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    } catch (error: any) {
      console.error("[Facebook Data Deletion] Error:", error);
      return res.status(500).json({ error: "Data deletion request failed" });
    }
  });

  // Also support GET for status check page
  app.get("/api/facebook/data-deletion", (req, res) => {
    res.json({
      status: "active",
      message: "Facebook data deletion endpoint. Send POST with signed_request to initiate deletion.",
      privacy_policy: "https://avalyarin.com.br/privacidade",
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

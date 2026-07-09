import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

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

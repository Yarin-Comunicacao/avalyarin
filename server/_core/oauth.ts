// Dual OAuth: Manus OAuth (dev/manus.space) or Google OAuth (production/avalyarin.com.br)
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// Detect which auth mode to use based on environment variables
const useManusOAuth = Boolean(ENV.oAuthServerUrl && ENV.oAuthServerUrl.length > 5);

export function registerOAuthRoutes(app: Express) {
  if (useManusOAuth) {
    console.log("[OAuth] Using Manus OAuth (OAUTH_SERVER_URL configured)");
    registerManusOAuthRoutes(app);
  } else {
    console.log("[OAuth] Using Google OAuth (no OAUTH_SERVER_URL)");
    registerGoogleOAuthRoutes(app);
  }
}

// ============================================
// MANUS OAUTH (for avaliabar-wg3u3svg.manus.space)
// ============================================
function registerManusOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Exchange code with Manus OAuth server
      const tokenUrl = `${ENV.oAuthServerUrl}/api/oauth/token`;
      const tokenResp = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          app_id: ENV.appId,
        }),
      });

      if (!tokenResp.ok) {
        const err = await tokenResp.text();
        console.error("[Manus OAuth] Token exchange failed:", err);
        res.status(500).json({ error: "Token exchange failed" });
        return;
      }

      const tokenData = (await tokenResp.json()) as {
        access_token: string;
        user: { open_id: string; name: string; email?: string; avatar?: string };
      };

      const manusUser = tokenData.user;
      const openId = manusUser.open_id;

      // Upsert user
      await db.upsertUser({
        openId,
        name: manusUser.name || null,
        email: manusUser.email ?? null,
        loginMethod: "manus",
        lastSignedIn: new Date(),
      });

      // Create session
      const sessionToken = await sdk.createSessionToken(openId, {
        name: manusUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to origin from state or home
      let redirectTo = "/";
      if (state) {
        try {
          const parsed = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
          if (parsed.returnPath) redirectTo = parsed.returnPath;
        } catch {
          // If state is just a URL, use it
          const decoded = Buffer.from(state, "base64").toString("utf-8");
          if (decoded.startsWith("/")) redirectTo = decoded;
        }
      }
      res.redirect(302, redirectTo);
    } catch (error: any) {
      console.error("[Manus OAuth] Callback failed:", error?.message || error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Login redirect for Manus OAuth
  app.get("/api/auth/login", (req: Request, res: Response) => {
    const origin = getQueryParam(req, "origin") || `${req.protocol}://${req.get("host")}`;
    const returnPath = getQueryParam(req, "returnPath") || "/";
    const state = Buffer.from(JSON.stringify({ origin, returnPath })).toString("base64");
    
    const portalUrl = process.env.VITE_OAUTH_PORTAL_URL || ENV.oAuthServerUrl;
    const loginUrl = `${portalUrl}/login?app_id=${ENV.appId}&state=${state}&redirect_uri=${encodeURIComponent(origin + "/api/oauth/callback")}`;
    
    res.redirect(302, loginUrl);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}

// ============================================
// GOOGLE OAUTH (for avalyarin.com.br / Render production)
// ============================================
function registerGoogleOAuthRoutes(app: Express) {
  // Google OAuth login redirect
  app.get("/api/auth/login", (req: Request, res: Response) => {
    const origin = getQueryParam(req, "origin") || `${req.protocol}://${req.get("host")}`;
    // Ensure https in production (behind proxy)
    const safeOrigin = process.env.NODE_ENV === "production" && origin.startsWith("http://")
      ? origin.replace("http://", "https://")
      : origin;
    const redirectUri = `${safeOrigin}/api/oauth/callback`;

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", ENV.googleClientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("state", Buffer.from(redirectUri).toString("base64"));
    console.log("[OAuth] Login redirect to Google, redirectUri:", redirectUri);

    res.redirect(302, googleAuthUrl.toString());
  });

  // OAuth callback - exchange code for tokens
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Determine redirect URI from state or construct it
      const redirectUri = state
        ? Buffer.from(state, "base64").toString("utf-8")
        : `${req.protocol}://${req.get("host")}/api/oauth/callback`;

      // Exchange code for tokens with Google
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResp.ok) {
        const err = await tokenResp.text();
        console.error("[OAuth] Token exchange failed:", err);
        res.status(500).json({ error: "Token exchange failed" });
        return;
      }

      const tokens = (await tokenResp.json()) as {
        access_token: string;
        id_token?: string;
        refresh_token?: string;
      };

      // Get user info from Google
      const userInfoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResp.ok) {
        res.status(500).json({ error: "Failed to get user info" });
        return;
      }

      const googleUser = (await userInfoResp.json()) as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      // ─── MERGE LOGIC ───────────────────────────────────────────────
      // Check if a user with this email already exists (registered via email/password or another method)
      const googleOpenId = `google_${googleUser.id}`;
      const database = await db.getDb();
      
      let existingUserByEmail: any = null;
      let existingUserByOpenId: any = null;

      if (database) {
        // 1. Check if user already exists with this Google openId
        existingUserByOpenId = await database.select().from(users)
          .where(eq(users.openId, googleOpenId))
          .limit(1)
          .then((r: any[]) => r[0] || null);

        // 2. If not found by openId, check by email (account merging)
        if (!existingUserByOpenId && googleUser.email) {
          existingUserByEmail = await database.select().from(users)
            .where(eq(users.email, googleUser.email))
            .limit(1)
            .then((r: any[]) => r[0] || null);
        }
      }

      let sessionOpenId: string;

      if (existingUserByOpenId) {
        // User already has a Google-linked account — just update lastSignedIn
        // DO NOT overwrite role
        if (database) {
          await database.update(users)
            .set({ 
              lastSignedIn: new Date(),
              googleId: googleUser.id,
              ...(googleUser.picture && !existingUserByOpenId.profilePhotoUrl ? { profilePhotoUrl: googleUser.picture } : {}),
            })
            .where(eq(users.id, existingUserByOpenId.id));
        }
        sessionOpenId = googleOpenId;

      } else if (existingUserByEmail) {
        // User exists with same email but different login method
        // MERGE: update their openId to Google openId, link Google account
        // PRESERVE their existing role, username, survey data, etc.
        if (database) {
          await database.update(users)
            .set({
              openId: googleOpenId,
              googleId: googleUser.id,
              loginMethod: "google",
              lastSignedIn: new Date(),
              emailVerified: true, // Google email is verified
              ...(googleUser.picture && !existingUserByEmail.profilePhotoUrl ? { profilePhotoUrl: googleUser.picture } : {}),
              // DO NOT update: role, name (keep existing), username, surveyData, etc.
            })
            .where(eq(users.id, existingUserByEmail.id));
        }
        sessionOpenId = googleOpenId;
        console.log(`[OAuth] Merged Google account into existing user (id: ${existingUserByEmail.id}, email: ${googleUser.email}, role: ${existingUserByEmail.role})`);

      } else {
        // Brand new user — create with default role "user"
        await db.upsertUser({
          openId: googleOpenId,
          name: googleUser.name || null,
          email: googleUser.email ?? null,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
        // Also save googleId
        if (database) {
          await database.update(users)
            .set({ googleId: googleUser.id, emailVerified: true })
            .where(eq(users.openId, googleOpenId));
        }
        sessionOpenId = googleOpenId;
      }

      // Create session JWT
      const sessionToken = await sdk.createSessionToken(sessionOpenId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[OAuth] Callback failed:", error?.message || error);
      res.status(500).json({ error: "OAuth callback failed", detail: error?.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
}

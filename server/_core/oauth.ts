// OAuth callback - Google OAuth direct
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
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

      // Upsert user in our database
      const openId = `google_${googleUser.id}`;
      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });


      // Create session JWT
      const sessionToken = await sdk.createSessionToken(openId, {
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

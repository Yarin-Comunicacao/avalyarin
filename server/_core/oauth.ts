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
  // Always register Facebook OAuth if credentials are available
  if (ENV.facebookClientId && ENV.facebookClientSecret) {
    console.log("[OAuth] Facebook OAuth enabled");
    registerFacebookOAuthRoutes(app);
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
      // Google profile URLs can be extremely long (1500+ chars with signatures)
      // Truncate to the base URL with size parameter only
      let safeProfilePhoto = googleUser.picture || null;
      if (safeProfilePhoto && safeProfilePhoto.length > 500) {
        // Extract just the base photo URL (before any long signature)
        const baseMatch = safeProfilePhoto.match(/^(https:\/\/lh3\.googleusercontent\.com\/a[^=]*)/);
        safeProfilePhoto = baseMatch ? baseMatch[1] + "=s96-c" : safeProfilePhoto.substring(0, 500);
      }
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
              ...(safeProfilePhoto && !existingUserByOpenId.profilePhotoUrl ? { profilePhotoUrl: safeProfilePhoto } : {}),
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
              ...(safeProfilePhoto && !existingUserByEmail.profilePhotoUrl ? { profilePhotoUrl: safeProfilePhoto } : {}),
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

// ============================================
// FACEBOOK OAUTH (for avalyarin.com.br / Render production)
// ============================================
function registerFacebookOAuthRoutes(app: Express) {
  // Facebook OAuth login redirect
  app.get("/api/auth/facebook", (req: Request, res: Response) => {
    const origin = getQueryParam(req, "origin") || `${req.protocol}://${req.get("host")}`;
    const safeOrigin = process.env.NODE_ENV === "production" && origin.startsWith("http://")
      ? origin.replace("http://", "https://")
      : origin;
    const redirectUri = `${safeOrigin}/api/oauth/facebook/callback`;

    const fbAuthUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    fbAuthUrl.searchParams.set("client_id", ENV.facebookClientId);
    fbAuthUrl.searchParams.set("redirect_uri", redirectUri);
    fbAuthUrl.searchParams.set("scope", "email,public_profile");
    fbAuthUrl.searchParams.set("state", Buffer.from(redirectUri).toString("base64"));
    console.log("[OAuth] Login redirect to Facebook, redirectUri:", redirectUri);

    res.redirect(302, fbAuthUrl.toString());
  });

  // Facebook OAuth callback
  app.get("/api/oauth/facebook/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const errorParam = getQueryParam(req, "error");

    if (errorParam) {
      console.error("[Facebook OAuth] User denied access:", errorParam);
      res.redirect(302, "/?error=facebook_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // Determine redirect URI from state
      const redirectUri = state
        ? Buffer.from(state, "base64").toString("utf-8")
        : `${req.protocol}://${req.get("host")}/api/oauth/facebook/callback`;

      // Exchange code for access token
      const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", ENV.facebookClientId);
      tokenUrl.searchParams.set("client_secret", ENV.facebookClientSecret);
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenResp = await fetch(tokenUrl.toString());
      if (!tokenResp.ok) {
        const err = await tokenResp.text();
        console.error("[Facebook OAuth] Token exchange failed:", err);
        res.status(500).json({ error: "Token exchange failed" });
        return;
      }

      const tokenData = (await tokenResp.json()) as { access_token: string; token_type: string };

      // Get user info from Facebook Graph API
      const userInfoUrl = new URL("https://graph.facebook.com/v19.0/me");
      userInfoUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
      userInfoUrl.searchParams.set("access_token", tokenData.access_token);

      const userInfoResp = await fetch(userInfoUrl.toString());
      if (!userInfoResp.ok) {
        res.status(500).json({ error: "Failed to get user info from Facebook" });
        return;
      }

      const fbUser = (await userInfoResp.json()) as {
        id: string;
        name: string;
        email?: string;
        picture?: { data?: { url?: string } };
      };

      // ─── MERGE LOGIC (same as Google) ───────────────────────────────
      const fbOpenId = `facebook_${fbUser.id}`;
      const database = await db.getDb();
      let existingUserByFacebookId: any = null;
      let existingUserByOpenId: any = null;
      let existingUserByEmail: any = null;

      if (database) {
        // 1. Check by facebookId field
        existingUserByFacebookId = await database.select().from(users)
          .where(eq(users.facebookId, fbUser.id))
          .limit(1)
          .then((r: any[]) => r[0] || null);

        // 2. Check by openId (facebook_xxx)
        if (!existingUserByFacebookId) {
          existingUserByOpenId = await database.select().from(users)
            .where(eq(users.openId, fbOpenId))
            .limit(1)
            .then((r: any[]) => r[0] || null);
        }

        // 3. Check by email (account merging — same email from Google/manual)
        if (!existingUserByFacebookId && !existingUserByOpenId && fbUser.email) {
          existingUserByEmail = await database.select().from(users)
            .where(eq(users.email, fbUser.email))
            .limit(1)
            .then((r: any[]) => r[0] || null);
        }
      }

      let sessionOpenId: string;
      const pictureUrl = fbUser.picture?.data?.url || null;

      if (existingUserByFacebookId) {
        // User already linked via facebookId — just update lastSignedIn
        if (database) {
          await database.update(users)
            .set({
              lastSignedIn: new Date(),
              ...(pictureUrl && !existingUserByFacebookId.profilePhotoUrl ? { profilePhotoUrl: pictureUrl } : {}),
            })
            .where(eq(users.id, existingUserByFacebookId.id));
        }
        sessionOpenId = existingUserByFacebookId.openId;
      } else if (existingUserByOpenId) {
        // User already has facebook openId — update lastSignedIn
        if (database) {
          await database.update(users)
            .set({
              lastSignedIn: new Date(),
              facebookId: fbUser.id,
              ...(pictureUrl && !existingUserByOpenId.profilePhotoUrl ? { profilePhotoUrl: pictureUrl } : {}),
            })
            .where(eq(users.id, existingUserByOpenId.id));
        }
        sessionOpenId = fbOpenId;
      } else if (existingUserByEmail) {
        // User exists with same email but different login method
        // MERGE: link Facebook account to existing user, DO NOT create new user
        if (database) {
          await database.update(users)
            .set({
              facebookId: fbUser.id,
              loginMethod: existingUserByEmail.loginMethod
                ? `${existingUserByEmail.loginMethod},facebook`
                : "facebook",
              lastSignedIn: new Date(),
              ...(pictureUrl && !existingUserByEmail.profilePhotoUrl ? { profilePhotoUrl: pictureUrl } : {}),
              // DO NOT update: role, name, username, openId, surveyData, etc.
            })
            .where(eq(users.id, existingUserByEmail.id));
        }
        sessionOpenId = existingUserByEmail.openId;
        console.log(`[Facebook OAuth] Merged Facebook account into existing user (id: ${existingUserByEmail.id}, email: ${fbUser.email}, role: ${existingUserByEmail.role})`);
      } else {
        // Brand new user — create with default role "user"
        if (!fbUser.email) {
          // Facebook user without email — redirect with error
          res.redirect(302, "/?error=facebook_no_email");
          return;
        }
        await db.upsertUser({
          openId: fbOpenId,
          name: fbUser.name || null,
          email: fbUser.email,
          loginMethod: "facebook",
          lastSignedIn: new Date(),
        });
        // Also save facebookId
        if (database) {
          await database.update(users)
            .set({ facebookId: fbUser.id, emailVerified: true })
            .where(eq(users.openId, fbOpenId));
        }
        sessionOpenId = fbOpenId;
      }

      // Create session JWT
      const sessionToken = await sdk.createSessionToken(sessionOpenId, {
        name: fbUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[Facebook OAuth] Callback failed:", error?.message || error);
      res.status(500).json({ error: "Facebook OAuth callback failed", detail: error?.message });
    }
  });
}

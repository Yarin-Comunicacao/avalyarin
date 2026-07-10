/**
 * Auth Próprio — Facebook, Google, Email/Senha
 * Substitui o Manus OAuth quando ativado.
 * Captação automática de foto de perfil do Facebook/Google.
 */
import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq, or } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";

const JWT_SECRET_KEY = new TextEncoder().encode(ENV.cookieSecret || "fallback-secret-key");
const COOKIE_NAME = "session";

// ============================================================
// HELPERS
// ============================================================

async function createSessionToken(userId: number): Promise<string> {
  return await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET_KEY);
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

async function downloadAndStorePhoto(url: string, userId: number): Promise<{ photoUrl: string; photoKey: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const key = `profile-photos/${userId}/social_${Date.now()}.${ext}`;
    const { url: storedUrl, key: storedKey } = await storagePut(key, buffer, contentType);
    return { photoUrl: storedUrl, photoKey: storedKey };
  } catch (err) {
    console.error("[Auth] Failed to download social photo:", err);
    return null;
  }
}

function generateOpenId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ============================================================
// FACEBOOK LOGIN
// ============================================================

async function handleFacebookLogin(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: "accessToken é obrigatório" });
    }

    // Validate token and get user info from Facebook Graph API
    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    if (!fbResponse.ok) {
      return res.status(401).json({ error: "Token do Facebook inválido" });
    }
    const fbUser = await fbResponse.json() as {
      id: string;
      name: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Check if user already exists by facebookId or email
    let existingUser = await db.select().from(users)
      .where(eq(users.facebookId, fbUser.id))
      .limit(1)
      .then(r => r[0]);

    if (!existingUser && fbUser.email) {
      existingUser = await db.select().from(users)
        .where(eq(users.email, fbUser.email))
        .limit(1)
        .then(r => r[0]);
      // Link Facebook ID to existing user
      if (existingUser) {
        await db.update(users)
          .set({ facebookId: fbUser.id, loginMethod: "facebook" })
          .where(eq(users.id, existingUser.id));
      }
    }

    let userId: number;

    if (existingUser) {
      userId = existingUser.id;
      // Update last sign in
      await db.update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const openId = generateOpenId();
      const result = await db.insert(users).values({
        openId,
        name: fbUser.name,
        email: fbUser.email || null,
        facebookId: fbUser.id,
        loginMethod: "facebook",
        emailVerified: fbUser.email ? true : false,
      });
      userId = result[0].insertId;
    }

    // Download and store profile photo from Facebook
    const photoUrl = fbUser.picture?.data?.url;
    if (photoUrl) {
      const stored = await downloadAndStorePhoto(photoUrl, userId);
      if (stored) {
        await db.update(users)
          .set({ profilePhotoUrl: stored.photoUrl, profilePhotoKey: stored.photoKey })
          .where(eq(users.id, userId));
      }
    }

    // Create session
    const token = await createSessionToken(userId);
    setSessionCookie(res, token);
    return res.json({ success: true, userId });
  } catch (err) {
    console.error("[Auth/Facebook] Error:", err);
    return res.status(500).json({ error: "Erro interno no login com Facebook" });
  }
}

// ============================================================
// GOOGLE LOGIN
// ============================================================

async function handleGoogleLogin(req: Request, res: Response) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "idToken é obrigatório" });
    }

    // Verify Google ID token via Google's tokeninfo endpoint
    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    if (!googleResponse.ok) {
      return res.status(401).json({ error: "Token do Google inválido" });
    }
    const googleUser = await googleResponse.json() as {
      sub: string;
      name?: string;
      email?: string;
      email_verified?: string;
      picture?: string;
    };

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Check if user already exists by googleId or email
    let existingUser = await db.select().from(users)
      .where(eq(users.googleId, googleUser.sub))
      .limit(1)
      .then(r => r[0]);

    if (!existingUser && googleUser.email) {
      existingUser = await db.select().from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1)
        .then(r => r[0]);
      // Link Google ID to existing user
      if (existingUser) {
        await db.update(users)
          .set({ googleId: googleUser.sub, loginMethod: "google" })
          .where(eq(users.id, existingUser.id));
      }
    }

    let userId: number;

    if (existingUser) {
      userId = existingUser.id;
      await db.update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Create new user
      const openId = generateOpenId();
      const result = await db.insert(users).values({
        openId,
        name: googleUser.name || null,
        email: googleUser.email || null,
        googleId: googleUser.sub,
        loginMethod: "google",
        emailVerified: googleUser.email_verified === "true",
      });
      userId = result[0].insertId;
    }

    // Download and store profile photo from Google
    if (googleUser.picture) {
      const stored = await downloadAndStorePhoto(googleUser.picture, userId);
      if (stored) {
        await db.update(users)
          .set({ profilePhotoUrl: stored.photoUrl, profilePhotoKey: stored.photoKey })
          .where(eq(users.id, userId));
      }
    }

    // Create session
    const token = await createSessionToken(userId);
    setSessionCookie(res, token);
    return res.json({ success: true, userId });
  } catch (err) {
    console.error("[Auth/Google] Error:", err);
    return res.status(500).json({ error: "Erro interno no login com Google" });
  }
}

// ============================================================
// EMAIL/SENHA LOGIN
// ============================================================

async function handleEmailRegister(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Check if email already exists
    const existing = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
      .then(r => r[0]);

    if (existing) {
      return res.status(409).json({ error: "Este email já está cadastrado" });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = generateOpenId();
    const result = await db.insert(users).values({
      openId,
      name: name || null,
      email: email.toLowerCase().trim(),
      passwordHash,
      loginMethod: "email",
      emailVerified: false,
    });
    const userId = result[0].insertId;

    // Create session
    const token = await createSessionToken(userId);
    setSessionCookie(res, token);
    return res.json({ success: true, userId });
  } catch (err) {
    console.error("[Auth/Email] Register error:", err);
    return res.status(500).json({ error: "Erro interno no cadastro" });
  }
}

async function handleEmailLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const user = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
      .then(r => r[0]);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Update last sign in
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const token = await createSessionToken(user.id);
    setSessionCookie(res, token);
    return res.json({ success: true, userId: user.id });
  } catch (err) {
    console.error("[Auth/Email] Login error:", err);
    return res.status(500).json({ error: "Erro interno no login" });
  }
}

// ============================================================
// REGISTER ROUTES
// ============================================================

export function registerOwnAuthRoutes(app: Express) {
  app.post("/api/auth/facebook", handleFacebookLogin);
  app.post("/api/auth/google", handleGoogleLogin);
  app.post("/api/auth/register", handleEmailRegister);
  app.post("/api/auth/login", handleEmailLogin);
}

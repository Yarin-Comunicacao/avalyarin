/**
 * Auth Próprio — Facebook, Google, Email/Senha
 * Substitui o Manus OAuth quando ativado.
 * Captação automática de foto de perfil do Facebook/Google.
 */
import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
// jose not needed — session tokens are created via sdk.createSessionToken
import { eq, or, sql } from "drizzle-orm";
import { getDb, generateCode } from "./db";
import { users } from "../drizzle/schema";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const COOKIE_NAME = "session";

// ============================================================
// HELPERS
// ============================================================

/**
 * Create session token using the same format as sdk.ts (openId + appId + name)
 * This ensures compatibility with the verifySession/authenticateRequest flow.
 */
async function createSessionToken(openId: string, name: string): Promise<string> {
  return await sdk.createSessionToken(openId, { name, expiresInMs: 30 * 24 * 60 * 60 * 1000 });
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

/**
 * Generate a unique user ID by querying MAX(id) + 1.
 * This ensures the app generates the ID explicitly, avoiding AUTO_INCREMENT issues.
 */
async function generateUserId(db: any): Promise<number> {
  const result = await db.select({ maxId: sql`MAX(id)` }).from(users);
  const currentMax = result[0]?.maxId || 0;
  return currentMax + 1;
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
      .then((r: any[]) => r[0]);

    if (!existingUser && fbUser.email) {
      existingUser = await db.select().from(users)
        .where(eq(users.email, fbUser.email))
        .limit(1)
        .then((r: any[]) => r[0]);
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
        .set({ lastSignedIn: new Date(), name: fbUser.name || existingUser.name })
        .where(eq(users.id, userId));
    } else {
      // Create new user - use stable facebook_<id> as openId
      const openId = `facebook_${fbUser.id}`;
      
      // Check if user already exists with this openId
      const existingByOpenId = await db.select().from(users)
        .where(eq(users.openId, openId))
        .limit(1)
        .then((r: any[]) => r[0]);
      
      if (existingByOpenId) {
        userId = existingByOpenId.id;
        await db.update(users)
          .set({ lastSignedIn: new Date(), facebookId: fbUser.id })
          .where(eq(users.id, userId));
      } else {
        const newId = await generateUserId(db);
        const newCode = await generateCode('users');
        await db.insert(users).values({
          id: newId,
          openId,
          code: newCode,
          name: fbUser.name,
          email: fbUser.email || null,
          facebookId: fbUser.id,
          loginMethod: "facebook",
          emailVerified: fbUser.email ? true : false,
          lastSignedIn: new Date(),
          role: "user",
          verified: false,
        });
        userId = newId;
      }
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

    // Create session — need to fetch the user's openId for the JWT
    const finalUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then((r: any[]) => r[0]);
    const token = await createSessionToken(finalUser!.openId, finalUser!.name || fbUser.name || "");
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
      .then((r: any[]) => r[0]);

    if (!existingUser && googleUser.email) {
      existingUser = await db.select().from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1)
        .then((r: any[]) => r[0]);
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
        .set({ lastSignedIn: new Date(), name: googleUser.name || existingUser.name })
        .where(eq(users.id, userId));
    } else {
      // Create new user - use stable google_<sub> as openId (consistent with oauth.ts redirect flow)
      const openId = `google_${googleUser.sub}`;
      
      // Check if user already exists with this openId (from redirect flow)
      const existingByOpenId = await db.select().from(users)
        .where(eq(users.openId, openId))
        .limit(1)
        .then((r: any[]) => r[0]);
      
      if (existingByOpenId) {
        userId = existingByOpenId.id;
        await db.update(users)
          .set({ lastSignedIn: new Date(), googleId: googleUser.sub })
          .where(eq(users.id, userId));
      } else {
        const newId = await generateUserId(db);
        const newCode = await generateCode('users');
        await db.insert(users).values({
          id: newId,
          openId,
          code: newCode,
          name: googleUser.name || null,
          email: googleUser.email || null,
          googleId: googleUser.sub,
          loginMethod: "google",
          emailVerified: googleUser.email_verified === "true",
          lastSignedIn: new Date(),
          role: "user",
          verified: false,
        });
        userId = newId;
      }
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

    // Create session — need to fetch the user's openId for the JWT
    const finalGoogleUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then((r: any[]) => r[0]);
    const token = await createSessionToken(finalGoogleUser!.openId, finalGoogleUser!.name || googleUser.name || "");
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
    const { email, password, name, username } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }
    // Validate username
    if (!username || username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username deve ter entre 3 e 30 caracteres" });
    }
    const usernameClean = username.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    if (usernameClean.length < 3) {
      return res.status(400).json({ error: "Username inválido. Use apenas letras, números, . e _" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Check if email already exists
    const existing = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (existing) {
      return res.status(409).json({ 
        error: "Usuário já cadastrado", 
        code: "USER_ALREADY_EXISTS",
        message: "Este email já está cadastrado. Faça login com sua conta existente.",
        loginMethod: existing.loginMethod || "email"
      });
    }

    // Check if username is taken
    const existingUsername = await db.select().from(users)
      .where(eq(users.username, usernameClean))
      .limit(1)
      .then((r: any[]) => r[0]);
    if (existingUsername) {
      return res.status(409).json({
        error: "Este @ já está em uso",
        code: "USERNAME_TAKEN",
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = generateOpenId();
    const newId = await generateUserId(db);
    const newCode = await generateCode('users');
    await db.insert(users).values({
      id: newId,
      openId,
      code: newCode,
      name: name || null,
      email: email.toLowerCase().trim(),
      username: usernameClean,
      passwordHash,
      loginMethod: "email",
      emailVerified: false,
      lastSignedIn: new Date(),
      role: "user",
      verified: false,
    });
    const userId = newId;

    // Create session
    const token = await createSessionToken(openId, name || "");
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
      .then((r: any[]) => r[0]);

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
    const token = await createSessionToken(user.openId, user.name || "");
    setSessionCookie(res, token);
    return res.json({ success: true, userId: user.id });
  } catch (err) {
    console.error("[Auth/Email] Login error:", err);
    return res.status(500).json({ error: "Erro interno no login" });
  }
}

// ============================================================
// FORGOT PASSWORD
// ============================================================

async function handleForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    const user = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
      .then((r: any[]) => r[0]);

    // Always return success to avoid email enumeration
    if (!user || !user.passwordHash) {
      return res.json({ success: true });
    }

    // Generate a 6-digit reset code
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const resetCodeHash = await bcrypt.hash(resetCode, 8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in user record
    await db.update(users)
      .set({ 
        passwordResetToken: resetCodeHash,
        passwordResetExpires: expiresAt,
      })
      .where(eq(users.id, user.id));

    // Notify owner about the reset request (so they can help the user if needed)
    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: `🔑 Reset de senha solicitado`,
        content: `Usuário: ${user.name || 'Sem nome'} (${email})\nCódigo: ${resetCode}\nExpira em 15 minutos.`,
      });
    } catch (notifErr) {
      console.error("[Auth] Failed to notify owner about reset:", notifErr);
    }

    console.log(`[Auth] Password reset code generated for ${email}: ${resetCode} (expires in 15min)`);
    
    return res.json({ success: true });
  } catch (err) {
    console.error("[Auth/ForgotPassword] Error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

async function handleResetPassword(req: Request, res: Response) {
  try {
    const { code, token, email, newPassword } = req.body;
    const resetCode = code || token; // Accept both 'code' and 'token' field names
    if (!resetCode || !newPassword || !email) {
      return res.status(400).json({ error: "Email, código e nova senha são obrigatórios" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Database unavailable" });

    // Find user by email with valid reset token
    const user = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ error: "Código inválido ou expirado" });
    }

    // Check if token is expired
    if (new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ error: "Código expirado. Solicite um novo." });
    }

    // Verify the code
    const valid = await bcrypt.compare(resetCode, user.passwordResetToken);
    if (!valid) {
      return res.status(400).json({ error: "Código incorreto" });
    }

    // Update password and clear reset token
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, user.id));

    console.log(`[Auth] Password reset successful for ${email}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Auth/ResetPassword] Error:", err);
    return res.status(500).json({ error: "Erro interno" });
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
  app.post("/api/auth/forgot-password", handleForgotPassword);
  app.post("/api/auth/reset-password", handleResetPassword);
}

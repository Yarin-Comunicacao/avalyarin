/**
 * QR Scan & Presential Rating Logic
 * 
 * Classification:
 * - presencial: avaliação feita em até 8h após escanear QR do estabelecimento
 * - hibrido: avaliação feita entre 8h e 48h após escanear QR
 * - remoto: nunca escaneou QR daquele estabelecimento
 * 
 * Selo Verificado:
 * - Critério oculto: 3 avaliações presenciais em 3 estabelecimentos diferentes
 * - Aparece como ícone ao lado do nome (sem explicação ao usuário)
 */

import { getDb } from "./db";
import { qrScans, ratings, users, establishments } from "../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// Constants
const PRESENCIAL_WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours
const HIBRIDO_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
const VERIFIED_THRESHOLD = 3; // 3 presencial ratings in 3 different estabs

/**
 * Register a QR scan with optional geolocation
 */
export async function registerQrScan(data: {
  userId: number;
  establishmentId: number;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(qrScans).values({
    userId: data.userId,
    establishmentId: data.establishmentId,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    scannedAt: Date.now(),
  });

  return { id: result.insertId, scannedAt: Date.now() };
}

/**
 * Get the most recent QR scan for a user at a specific establishment
 */
export async function getLatestQrScan(userId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const [scan] = await db
    .select()
    .from(qrScans)
    .where(
      and(
        eq(qrScans.userId, userId),
        eq(qrScans.establishmentId, establishmentId)
      )
    )
    .orderBy(desc(qrScans.scannedAt))
    .limit(1);

  return scan || null;
}

/**
 * Classify the rating source based on the latest QR scan
 * - presencial: scan within 8h
 * - hibrido: scan between 8h and 48h
 * - remoto: no scan or scan older than 48h
 */
export function classifyRatingSource(lastScanTimestamp: number | null): "presencial" | "hibrido" | "remoto" {
  if (!lastScanTimestamp) return "remoto";

  const elapsed = Date.now() - lastScanTimestamp;

  if (elapsed <= PRESENCIAL_WINDOW_MS) return "presencial";
  if (elapsed <= HIBRIDO_WINDOW_MS) return "hibrido";
  return "remoto";
}

/**
 * Determine the source for a rating being saved
 */
export async function determineRatingSource(userId: number, establishmentId: number): Promise<"presencial" | "hibrido" | "remoto"> {
  const scan = await getLatestQrScan(userId, establishmentId);
  if (!scan) return "remoto";
  return classifyRatingSource(scan.scannedAt);
}

/**
 * Check if a user qualifies for the verified seal
 * Criteria: 3 presencial ratings in 3 DIFFERENT establishments
 * This is a hidden criteria - user doesn't know about it
 */
export async function checkVerifiedStatus(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select({ distinctEstabs: sql<number>`COUNT(DISTINCT ${ratings.establishmentId})` })
    .from(ratings)
    .where(
      and(
        eq(ratings.userId, userId),
        eq(ratings.source, "presencial")
      )
    );

  const count = result[0]?.distinctEstabs ?? 0;
  return count >= VERIFIED_THRESHOLD;
}

/**
 * Update user's verified status if they qualify
 * Returns true if status changed
 */
export async function updateVerifiedStatus(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const qualifies = await checkVerifiedStatus(userId);

  // Get current status
  const [user] = await db
    .select({ verified: users.verified })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Only update if status changed (and only upgrade, never downgrade)
  if (qualifies && !user.verified) {
    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, userId));
    return true;
  }

  return false;
}

/**
 * Get all QR scans for a user (for debugging/admin)
 */
export async function getUserQrScans(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: qrScans.id,
      establishmentId: qrScans.establishmentId,
      latitude: qrScans.latitude,
      longitude: qrScans.longitude,
      scannedAt: qrScans.scannedAt,
    })
    .from(qrScans)
    .where(eq(qrScans.userId, userId))
    .orderBy(desc(qrScans.scannedAt))
    .limit(limit);
}

/**
 * Validate geolocation proximity (optional enhancement)
 * Returns true if user is within ~200m of the establishment
 */
export function isNearEstablishment(
  userLat: number,
  userLng: number,
  estabLat: number,
  estabLng: number,
  maxDistanceMeters = 200
): boolean {
  // Haversine formula
  const R = 6371000; // Earth radius in meters
  const dLat = (estabLat - userLat) * Math.PI / 180;
  const dLng = (estabLng - userLng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(estabLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= maxDistanceMeters;
}

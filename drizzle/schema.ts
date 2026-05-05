import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner", "business"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table - types of establishments (Bar & Lanchonete, Cozinha Brasileira, etc.)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Establishments table - bars, restaurants, cafes, etc.
 */
export const establishments = mysqlTable("establishments", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  neighborhood: varchar("neighborhood", { length: 128 }),
  region: varchar("region", { length: 64 }),
  lat: float("lat"),
  lng: float("lng"),
  rating: float("rating"),
  reviewCount: int("reviewCount"),
  image: text("image"),
  hours: varchar("hours", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  instagram: varchar("instagram", { length: 128 }),
  categoryId: int("categoryId").notNull(),
  hasMenu: boolean("hasMenu").default(false).notNull(),
  source: varchar("source", { length: 32 }).default("spreadsheet"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Establishment = typeof establishments.$inferSelect;
export type InsertEstablishment = typeof establishments.$inferInsert;

/**
 * Menu items table - dishes, drinks, etc. belonging to an establishment
 */
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: float("price"),
  category: varchar("category", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MenuItemRow = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Ratings table - user ratings for establishments
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  type: mysqlEnum("type", ["direct", "analytic"]).notNull(),
  visitDate: timestamp("visitDate"),
  overallScore: float("overallScore"),
  // Cost breakdown
  subtotal: float("subtotal"),
  servicePercent: float("servicePercent"),
  couvert: float("couvert"),
  valet: float("valet"),
  parking: float("parking"),
  totalCost: float("totalCost"),
  // Analytic criteria scores (JSON for flexibility)
  criteriaScores: json("criteriaScores"),
  // Bonus criteria scores
  bonusScores: json("bonusScores"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Rating items table - individual item ratings within a rating
 */
export const ratingItems = mysqlTable("rating_items", {
  id: int("id").autoincrement().primaryKey(),
  ratingId: int("ratingId").notNull(),
  menuItemId: int("menuItemId"),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  score: float("score").notNull(),
  comment: text("comment"),
  quantity: int("quantity").default(1),
  price: float("price"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RatingItem = typeof ratingItems.$inferSelect;
export type InsertRatingItem = typeof ratingItems.$inferInsert;

/**
 * Business claims table - requests from business owners to manage an establishment
 */
export const businessClaims = mysqlTable("business_claims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  // Proof of ownership
  businessName: varchar("businessName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  proofDescription: text("proofDescription"),
  // Admin response
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessClaim = typeof businessClaims.$inferSelect;
export type InsertBusinessClaim = typeof businessClaims.$inferInsert;

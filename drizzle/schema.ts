import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, json, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 64 }).unique(),
  birthdate: varchar("birthdate", { length: 10 }), // YYYY-MM-DD
  surveyData: json("surveyData"), // Full survey answers JSON
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
  hidden: boolean("hidden").default(false).notNull(),
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
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  imageThumbUrl: text("imageThumbUrl"),
  imageThumbKey: varchar("imageThumbKey", { length: 512 }),
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

/**
 * User rankings table - personal top 10 (or top 3) per category
 * Each row represents one establishment in a user's ranking for a specific category.
 * Position 1 = best, position 10 = 10th best.
 */
export const userRankings = mysqlTable("user_rankings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  position: int("position").notNull(), // 1-10
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserRanking = typeof userRankings.$inferSelect;
export type InsertUserRanking = typeof userRankings.$inferInsert;

/**
 * Age verification requests table — when a user wants to set birthdate that makes them <18,
 * they must upload an identity document (RG/CPF) for admin review.
 */
export const ageVerificationRequests = mysqlTable("age_verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentUrl: text("documentUrl").notNull(), // S3 storage URL
  documentKey: varchar("documentKey", { length: 512 }).notNull(), // S3 key
  requestedBirthdate: varchar("requestedBirthdate", { length: 10 }).notNull(), // YYYY-MM-DD
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgeVerificationRequest = typeof ageVerificationRequests.$inferSelect;
export type InsertAgeVerificationRequest = typeof ageVerificationRequests.$inferInsert;

/**
 * User plans table — tracks subscription tier per user.
 * free = default (3 groups max, cannot create influencer groups)
 * premium = paid (unlimited groups, can create influencer groups)
 */
export const userPlans = mysqlTable("user_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "premium"]).default("free").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = typeof userPlans.$inferInsert;

/**
 * Groups table — two types:
 * - "private": user shares ratings with chosen members (Meus Grupos)
 * - "influencer": creator publishes reviews/notes, followers can view (Grupos que Sigo)
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["private", "influencer"]).notNull(),
  creatorId: int("creatorId").notNull(),
  image: text("image"),
  memberCount: int("memberCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Group members table — tracks membership in groups.
 * For private groups: role is "member" or "admin" (creator)
 * For influencer groups: role is "creator" or "follower"
 */
export const groupMembers = mysqlTable("group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "member", "creator", "follower"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Group invites table — pending invitations for private groups.
 * Inviter sends to invitee via @username; invitee accepts/rejects.
 */
export const groupInvites = mysqlTable("group_invites", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = typeof groupInvites.$inferInsert;

/**
 * Group shared ratings — links a rating to a group so members can see it.
 * For private groups: any member can share their rating.
 * For influencer groups: only the creator shares ratings (as "posts").
 */
export const groupSharedRatings = mysqlTable("group_shared_ratings", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  ratingId: int("ratingId").notNull(),
  sharedById: int("sharedById").notNull(),
  note: text("note"), // Optional note/annotation from the sharer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GroupSharedRating = typeof groupSharedRatings.$inferSelect;
export type InsertGroupSharedRating = typeof groupSharedRatings.$inferInsert;

/**
 * Establishment posts table — ephemeral 9:16 vertical content (Stories-like)
 * Posted by business accounts, shown in carousels on Home.
 * Types: event, promotion, brand, menu_daily
 */
export const establishmentPosts = mysqlTable("establishment_posts", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(), // who posted (business account)
  type: mysqlEnum("type", ["event", "promotion", "brand", "menu_daily"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(), // 9:16 vertical image
  imageKey: varchar("imageKey", { length: 512 }), // S3 key
  linkUrl: text("linkUrl"), // optional external link
  // Scheduling and expiration
  startsAt: timestamp("startsAt").notNull(), // when post becomes visible
  expiresAt: timestamp("expiresAt").notNull(), // when post disappears
  // Metrics
  viewCount: int("viewCount").default(0).notNull(),
  tapCount: int("tapCount").default(0).notNull(), // taps/clicks
  // Status
  status: mysqlEnum("status", ["draft", "active", "expired", "removed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EstablishmentPost = typeof establishmentPosts.$inferSelect;
export type InsertEstablishmentPost = typeof establishmentPosts.$inferInsert;

/**
 * User saved establishments — "following" an establishment for the Salvos carousel
 */
export const userSavedEstablishments = mysqlTable("user_saved_establishments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSavedEstablishment = typeof userSavedEstablishments.$inferSelect;
export type InsertUserSavedEstablishment = typeof userSavedEstablishments.$inferInsert;

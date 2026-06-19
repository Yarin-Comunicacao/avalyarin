import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, json, date, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 16 }).unique(), // Visual ID: numeric (1-200000000)
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 64 }).unique(),
  birthdate: varchar("birthdate", { length: 10 }), // YYYY-MM-DD
  surveyData: json("surveyData"), // Full survey answers JSON
  role: mysqlEnum("role", ["user", "admin", "owner", "business", "influencer", "critic", "support"]).default("user").notNull(),
  verified: boolean("verified").default(false).notNull(),
  lat: float("lat"),
  lng: float("lng"),
  locationUpdatedAt: bigint("locationUpdatedAt", { mode: "number" }),
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
  code: varchar("code", { length: 8 }).unique(), // Visual ID: ca001-ca999
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
  code: varchar("code", { length: 12 }).unique(), // Visual ID: es000001-es999999
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
  logo: text("logo"),
  hours: varchar("hours", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  instagram: varchar("instagram", { length: 128 }),
  categoryId: int("categoryId").notNull(),
  description: text("description"),
  complement: varchar("complement", { length: 255 }),
  addressNumber: varchar("addressNumber", { length: 20 }),
  hasMenu: boolean("hasMenu").default(false).notNull(),
  status: mysqlEnum("status", ["active", "hidden", "pending"]).default("active").notNull(),
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
  code: varchar("code", { length: 12 }).unique(), // Visual ID: mi000001-mi999999
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
  code: varchar("code", { length: 12 }).unique(), // Visual ID: ra000001-ra999999
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
    source: mysqlEnum("source", ["presencial", "hibrido", "remoto"]).default("remoto").notNull(),
  relevanceScore: int("relevanceScore"), // 0-100, LLM-calculated comment depth/utility score
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
 * free = default (3 avaliações/dia, 3 groups max)
 * premium = R$9,90/mês (5 avaliações/dia, grupos ilimitados, Double na 1ª visita)
 * embaixador = R$19,90/mês (avaliações ilimitadas, descontos parceiros, destaque)
 */
export const userPlans = mysqlTable("user_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "premium", "embaixador"]).default("free").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = typeof userPlans.$inferInsert;

/**
 * Subscriptions table — tracks payment history and subscription lifecycle.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plan: mysqlEnum("plan", ["premium", "embaixador"]).notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"]).default("active").notNull(),
  priceMonthly: float("priceMonthly").notNull(), // valor em R$
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "credit_card", "admin_grant"]).default("admin_grant").notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Business subscriptions — plans for establishments.
 * free = 1 código promo ativo, perfil básico
 * premium = códigos ilimitados, analytics, destaque no app
 */
export const businessSubscriptions = mysqlTable("business_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(), // business owner
  plan: mysqlEnum("plan", ["free", "premium"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  priceMonthly: float("priceMonthly"), // null = free
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessSubscription = typeof businessSubscriptions.$inferSelect;
export type InsertBusinessSubscription = typeof businessSubscriptions.$inferInsert;

/**
 * Groups table — two types:
 * - "private": user shares ratings with chosen members (Meus Grupos)
 * - "influencer": creator publishes reviews/notes, followers can view (Grupos que Sigo)
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 12 }).unique(), // Visual ID: gr000001-gr999999
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
  type: mysqlEnum("type", ["event", "promotion", "brand", "menu_daily", "new_item", "collab"]).notNull(),
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

/**
 * Establishment categories (N:N) — allows multiple categories per establishment.
 * isPrimary = true means the original/main category.
 */
export const establishmentCategories = mysqlTable("establishment_categories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  categoryId: int("categoryId").notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EstablishmentCategory = typeof establishmentCategories.$inferSelect;
export type InsertEstablishmentCategory = typeof establishmentCategories.$inferInsert;

/**
 * Menu categories table — tracks category names and their display order per establishment.
 * Allows drag-and-drop reordering of menu categories.
 */
export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;


// ============================================================
// Business Notifications (persistent, e.g. new ratings received)
// ============================================================
export const businessNotifications = mysqlTable("business_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // business owner
  establishmentId: int("establishmentId").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // 'new_rating', 'claim_approved', etc.
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  ratingId: int("ratingId"), // optional reference to the rating
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BusinessNotification = typeof businessNotifications.$inferSelect;
export type InsertBusinessNotification = typeof businessNotifications.$inferInsert;


// ============================================================
// Promo Codes — códigos promocionais criados por estabs ou influencers
// ============================================================
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // ex: YARIN10, SAMBA20
  type: mysqlEnum("type", ["percentage", "buy_one_get_one", "free_item", "fixed_discount"]).notNull(),
  value: float("value"), // valor do desconto (% ou R$), null para buy_one_get_one
  description: text("description"), // descrição visível ao usuário
  creatorId: int("creatorId").notNull(), // user id do criador
  creatorType: mysqlEnum("creatorType", ["influencer", "business"]).notNull(),
  establishmentId: int("establishmentId"), // estab vinculado (NULL = qualquer parceiro)
  startsAt: bigint("startsAt", { mode: "number" }), // início validade (timestamp ms)
  expiresAt: bigint("expiresAt", { mode: "number" }), // fim validade (NULL = permanente, requer plano pago)
  maxUses: int("maxUses"), // limite total (NULL = ilimitado)
  maxUsesPerUser: int("maxUsesPerUser").default(1), // limite por usuário
  firstVisitOnly: boolean("firstVisitOnly").default(false).notNull(), // só na primeira visita
  status: mysqlEnum("status", ["pending_approval", "active", "rejected", "expired", "paused"]).default("pending_approval").notNull(),
  adminNotes: text("adminNotes"), // notas do admin ao aprovar/rejeitar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// ============================================================
// Promo Code Uses — registro de uso de códigos por usuários
// ============================================================
export const promoCodeUses = mysqlTable("promo_code_uses", {
  id: int("id").autoincrement().primaryKey(),
  codeId: int("codeId").notNull(), // FK para promo_codes.id
  userId: int("userId").notNull(), // usuário que usou
  establishmentId: int("establishmentId").notNull(), // estab onde foi usado
  discountApplied: float("discountApplied"), // valor real do desconto aplicado
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export type PromoCodeUse = typeof promoCodeUses.$inferSelect;
export type InsertPromoCodeUse = typeof promoCodeUses.$inferInsert;

// ============================================================
// Influencer Applications — solicitações para virar influencer
// ============================================================
export const influencerApplications = mysqlTable("influencer_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // quem está solicitando
  selectedRatingIds: json("selectedRatingIds").notNull(), // array de IDs de ratings selecionadas
  totalRatings: int("totalRatings").notNull(), // total de avaliações do usuário no momento
  qualifiedRatings: int("qualifiedRatings").notNull(), // quantas das selecionadas são qualificadas
  motivation: text("motivation"), // texto opcional de motivação
  socialMedia: text("socialMedia"), // links de redes sociais (Instagram, TikTok, etc.)
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"), // notas do admin ao aprovar/rejeitar
  reviewedAt: bigint("reviewedAt", { mode: "number" }), // quando foi revisado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfluencerApplication = typeof influencerApplications.$inferSelect;
export type InsertInfluencerApplication = typeof influencerApplications.$inferInsert;

// ============================================================
// Partnerships — parcerias entre influencers e estabelecimentos
// ============================================================
export const partnerships = mysqlTable("partnerships", {
  id: int("id").autoincrement().primaryKey(),
  influencerId: int("influencerId").notNull(), // user id do influencer
  establishmentId: int("establishmentId").notNull(), // estab parceiro
  promoCodeId: int("promoCodeId"), // código vinculado à parceria (opcional)
  proposedBy: mysqlEnum("proposedBy", ["influencer", "establishment"]).notNull(),
  status: mysqlEnum("status", ["pending_estab", "pending_admin", "active", "rejected_estab", "rejected_admin", "cancelled", "expired"]).default("pending_estab").notNull(),
  terms: text("terms"), // termos da parceria (desconto oferecido, condições)
  estabNotes: text("estabNotes"), // notas do estab ao aceitar/rejeitar
  adminNotes: text("adminNotes"), // notas do admin ao aprovar
  startsAt: bigint("startsAt", { mode: "number" }), // início da parceria
  expiresAt: bigint("expiresAt", { mode: "number" }), // fim da parceria (NULL = indefinido)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;


// ============================================================
// QR Scans — registro de scans de QR code com geolocalização
// ============================================================
export const qrScans = mysqlTable("qr_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  latitude: float("latitude"),
  longitude: float("longitude"),
  scannedAt: bigint("scannedAt", { mode: "number" }).notNull(), // Unix timestamp ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QrScan = typeof qrScans.$inferSelect;
export type InsertQrScan = typeof qrScans.$inferInsert;

// ============================================================
// Influencer Follows — usuários seguindo influencers
// ============================================================
export const influencerFollows = mysqlTable("influencer_follows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // quem segue
  influencerId: int("influencerId").notNull(), // influencer seguido
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfluencerFollow = typeof influencerFollows.$inferSelect;
export type InsertInfluencerFollow = typeof influencerFollows.$inferInsert;

// ============================================================
// Support Assignments — vincula estabs à carteira de um suporte
// ============================================================
export const supportAssignments = mysqlTable("support_assignments", {
  id: int("id").autoincrement().primaryKey(),
  supportUserId: int("supportUserId").notNull(), // user com role 'support'
  establishmentId: int("establishmentId").notNull(),
  assignedBy: int("assignedBy").notNull(), // admin que fez a atribuição
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type SupportAssignment = typeof supportAssignments.$inferSelect;
export type InsertSupportAssignment = typeof supportAssignments.$inferInsert;

// ============================================================
// Support Tickets — tickets de suporte vinculados a estabs
// ============================================================
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 12 }).unique(), // Visual ID: st000001-st999999
  establishmentId: int("establishmentId").notNull(),
  supportUserId: int("supportUserId"), // suporte atribuído (null = não atribuído)
  createdById: int("createdById").notNull(), // quem criou (business, support ou admin)
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  resolution: text("resolution"), // notas de resolução
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// ============================================================
// Group Events — eventos agendados dentro de grupos
// ============================================================
export const groupEvents = mysqlTable("group_events", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 12 }).unique(), // Visual ID: ev000001-ev999999
  groupId: int("groupId").notNull(),
  creatorId: int("creatorId").notNull(),
  establishmentId: int("establishmentId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(), // data e hora do evento
  maxGuests: int("maxGuests"), // limite de pessoas (null = sem limite)
  status: mysqlEnum("status", ["active", "cancelled", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GroupEvent = typeof groupEvents.$inferSelect;
export type InsertGroupEvent = typeof groupEvents.$inferInsert;

// ============================================================
// Event RSVPs — confirmações de presença nos eventos
// ============================================================
export const eventRsvps = mysqlTable("event_rsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["confirmed", "maybe", "declined"]).default("confirmed").notNull(),
  respondedAt: timestamp("respondedAt").defaultNow().notNull(),
});
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

// ============================================================
// Rating Photos — fotos enviadas nas avaliações
// ============================================================
export const ratingPhotos = mysqlTable("rating_photos", {
  id: int("id").autoincrement().primaryKey(),
  ratingId: int("ratingId").notNull(),
  userId: int("userId").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  taggedItemIds: text("taggedItemIds"), // JSON array of menu item IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RatingPhoto = typeof ratingPhotos.$inferSelect;
export type InsertRatingPhoto = typeof ratingPhotos.$inferInsert;

// ============================================================
// Integrations — tokens e configurações de integrações externas
// ============================================================
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  label: varchar("label", { length: 255 }),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

// ============================================================
// Critic Profiles — perfis de críticos gastronômicos verificados
// ============================================================
export const criticProfiles = mysqlTable("critic_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 255 }),
  bio: text("bio"),
  publication: varchar("publication", { length: 255 }), // Veículo: "Folha de S.Paulo", "Blog Gastro SP", etc.
  publicationUrl: varchar("publicationUrl", { length: 512 }),
  specialty: varchar("specialty", { length: 255 }), // Ex: "Cozinha Japonesa", "Bares de Coquetelaria"
  verified: boolean("verified").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CriticProfile = typeof criticProfiles.$inferSelect;
export type InsertCriticProfile = typeof criticProfiles.$inferInsert;

// ============================================================
// Chat — Mensagens de grupo, suporte 1:1, transmissões business
// ============================================================

/**
 * Group messages — chat dentro de grupos (limite 140 chars).
 * Qualquer membro (user, influencer, critic) pode enviar.
 */
export const groupMessages = mysqlTable("group_messages", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  senderId: int("senderId").notNull(),
  content: varchar("content", { length: 140 }).notNull(),
  // Tipo especial para compartilhamentos (avaliação, estabelecimento, perfil)
  type: mysqlEnum("type", ["text", "share_rating", "share_establishment", "share_profile"]).default("text").notNull(),
  referenceId: int("referenceId"), // ID do item compartilhado (ratingId, establishmentId, userId)
  referenceSlug: varchar("referenceSlug", { length: 255 }), // slug para link direto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = typeof groupMessages.$inferInsert;

/**
 * Support messages — chat 1:1 entre support e clientes.
 * Support pode enviar para qualquer role; cliente responde no mesmo thread.
 */
export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Business broadcasts — mensagens de transmissão do business para seguidores.
 * Apenas o business envia; seguidores (quem salvou) apenas leem.
 */
export const businessBroadcasts = mysqlTable("business_broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  businessUserId: int("businessUserId").notNull(), // userId do dono do business
  establishmentId: int("establishmentId").notNull(),
  content: varchar("content", { length: 280 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BusinessBroadcast = typeof businessBroadcasts.$inferSelect;
export type InsertBusinessBroadcast = typeof businessBroadcasts.$inferInsert;

/**
 * Business followers — quem salvou o business entra automaticamente no canal.
 * Read-only para o follower; o business envia broadcasts.
 */
export const businessFollowers = mysqlTable("business_followers", {
  id: int("id").autoincrement().primaryKey(),
  establishmentId: int("establishmentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BusinessFollower = typeof businessFollowers.$inferSelect;
export type InsertBusinessFollower = typeof businessFollowers.$inferInsert;


/**
 * User follows — relação de seguir entre usuários.
 */
export const userFollows = mysqlTable("user_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

/**
 * Direct messages — chat 1:1 entre users que se seguem mutuamente.
 */
export const directMessages = mysqlTable("direct_messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  content: varchar("content", { length: 500 }).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = typeof directMessages.$inferInsert;

// ============================================================
// Photo Likes — curtidas em fotos de avaliações
// ============================================================
export const photoLikes = mysqlTable("photo_likes", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PhotoLike = typeof photoLikes.$inferSelect;
export type InsertPhotoLike = typeof photoLikes.$inferInsert;

// ============================================================
// Photo Shares — compartilhamentos de fotos para grupos
// ============================================================
export const photoShares = mysqlTable("photo_shares", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull(),
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  comment: varchar("comment", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PhotoShare = typeof photoShares.$inferSelect;
export type InsertPhotoShare = typeof photoShares.$inferInsert;

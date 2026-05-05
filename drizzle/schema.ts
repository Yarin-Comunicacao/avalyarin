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
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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

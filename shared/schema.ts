import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for auth
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// User settings table
export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id),
  currency: text("currency").default("USD").notNull(),
  currencySymbol: text("currency_symbol").default("$").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  dateFormat: text("date_format").default("MM/DD/YYYY").notNull(),
  language: text("language").default("en").notNull(),
  theme: text("theme").default("light").notNull(),
  notifications: integer("notifications").default(1).notNull(),
  emailNotifications: integer("email_notifications").default(1).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Zones table for warehouse location management
export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  description: text("description"),
  capacity: integer("capacity").default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Products table for inventory items
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id", { length: 50 }).notNull().unique(),
  name: text("name", { length: 200 }).notNull(),
  description: text("description"),
  category: text("category", { length: 100 }).notNull(),
  zoneId: integer("zone_id").references(() => zones.id),
  currentStock: integer("current_stock").default(0),
  minStock: integer("min_stock").default(0),
  unitPrice: real("unit_price"),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Movement logs for tracking stock changes
export const movements = sqliteTable("movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id).notNull(),
  type: text("type", { length: 20 }).notNull(), // 'IN' or 'OUT'
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason", { length: 100 }),
  userId: text("user_id").references(() => users.id),
  createdAt: integer("created_at").notNull(),
});

// Define relations
export const productsRelations = relations(products, ({ one, many }) => ({
  zone: one(zones, {
    fields: [products.zoneId],
    references: [zones.id],
  }),
  movements: many(movements),
}));

export const zonesRelations = relations(zones, ({ many }) => ({
  products: many(products),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  product: one(products, {
    fields: [movements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [movements.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  movements: many(movements),
  settings: one(userSettings),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertZoneSchema = createInsertSchema(zones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currentStock: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  unitPrice: z.coerce.number().min(0).default(0),
  zoneId: z.coerce.number().optional(),
});

export const insertMovementSchema = createInsertSchema(movements).omit({
  id: true,
  createdAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserSettingsSchema = createInsertSchema(userSettings).omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"]),
  theme: z.enum(["light", "dark", "system"]),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  language: z.enum(["en", "es", "fr", "de", "ja", "zh"]),
  notifications: z.coerce.number().min(0).max(1),
  emailNotifications: z.coerce.number().min(0).max(1),
  lowStockThreshold: z.coerce.number().min(1).max(1000),
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;

// Extended types for API responses
export type ProductWithZone = Product & {
  zone: Zone | null;
};

export type MovementWithProduct = Movement & {
  product: Product;
  user: User | null;
};

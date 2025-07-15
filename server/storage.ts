import {
  users,
  userSettings,
  zones,
  products,
  movements,
  type User,
  type UpsertUser,
  type UserSettings,
  type UpdateUserSettings,
  type Zone,
  type InsertZone,
  type Product,
  type InsertProduct,
  type ProductWithZone,
  type Movement,
  type InsertMovement,
  type MovementWithProduct,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, 'id'> & { id?: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>>): Promise<User>;
  updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: UpdateUserSettings): Promise<UserSettings>;
  createDefaultUserSettings(userId: string): Promise<UserSettings>;

  // Zone operations
  getZones(): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: number, zone: Partial<InsertZone>): Promise<Zone>;
  deleteZone(id: number): Promise<void>;

  // Product operations
  getProducts(filters?: {
    category?: string;
    zoneId?: number;
    status?: "all" | "in_stock" | "low_stock" | "out_of_stock";
    search?: string;
  }): Promise<ProductWithZone[]>;
  getProduct(id: number): Promise<ProductWithZone | undefined>;
  getProductByProductId(productId: string): Promise<ProductWithZone | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Movement operations
  getMovements(productId?: number, limit?: number): Promise<MovementWithProduct[]>;
  createMovement(movement: InsertMovement): Promise<Movement>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    recentActivities: MovementWithProduct[];
    zoneStatus: Array<Zone & { itemCount: number; capacity: number }>;
  }>;

  // Stock operations
  updateStock(productId: number, quantity: number, type: "IN" | "OUT", reason?: string, userId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'id'> & { id?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = Date.now();
    const [user] = await db
      .insert(users)
      .values({ ...userData, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: now,
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>>): Promise<User> {
    const now = Date.now();
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: now })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUser(id);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // In a real application, you would verify the current password hash
    // For this example, we'll skip the verification and just update the password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const now = Date.now();
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: now })
      .where(eq(users.id, id));

    return { success: true, message: "Password updated successfully" };
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateUserSettings(userId: string, settingsData: UpdateUserSettings): Promise<UserSettings> {
    const now = Date.now();
    const [settings] = await db
      .insert(userSettings)
      .values({ ...settingsData, userId, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settingsData,
          updatedAt: now,
        },
      })
      .returning();
    return settings;
  }

  async createDefaultUserSettings(userId: string): Promise<UserSettings> {
    const now = Date.now();
    const [settings] = await db
      .insert(userSettings)
      .values({
        userId,
        currency: "USD",
        currencySymbol: "$",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        language: "en",
        theme: "light",
        notifications: 1,
        emailNotifications: 1,
        lowStockThreshold: 10,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return settings;
  }

  // Zone operations
  async getZones(): Promise<Zone[]> {
    return await db.select().from(zones).orderBy(asc(zones.name));
  }

  async getZone(id: number): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone;
  }

  async createZone(zone: InsertZone): Promise<Zone> {
    const now = Date.now();
    const [newZone] = await db.insert(zones).values({
      ...zone,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return newZone;
  }

  async updateZone(id: number, zone: Partial<InsertZone>): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ ...zone, updatedAt: Date.now() })
      .where(eq(zones.id, id))
      .returning();
    return updatedZone;
  }

  async deleteZone(id: number): Promise<void> {
    await db.delete(zones).where(eq(zones.id, id));
  }

  // Product operations
  async getProducts(filters?: {
    category?: string;
    zoneId?: number;
    status?: "all" | "in_stock" | "low_stock" | "out_of_stock";
    search?: string;
  }): Promise<ProductWithZone[]> {
    const conditions = [eq(products.isActive, true)];

    if (filters?.category) {
      conditions.push(eq(products.category, filters.category));
    }

    if (filters?.zoneId) {
      conditions.push(eq(products.zoneId, filters.zoneId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.productId, `%${filters.search}%`),
          like(products.category, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status) {
      switch (filters.status) {
        case "in_stock":
          conditions.push(sql`${products.currentStock} > ${products.minStock}`);
          break;
        case "low_stock":
          conditions.push(
            and(
              sql`${products.currentStock} <= ${products.minStock}`,
              sql`${products.currentStock} > 0`
            )
          );
          break;
        case "out_of_stock":
          conditions.push(eq(products.currentStock, 0));
          break;
      }
    }

    const result = await db
      .select({
        id: products.id,
        productId: products.productId,
        name: products.name,
        description: products.description,
        category: products.category,
        zoneId: products.zoneId,
        currentStock: products.currentStock,
        minStock: products.minStock,
        unitPrice: products.unitPrice,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        zone: zones,
      })
      .from(products)
      .leftJoin(zones, eq(products.zoneId, zones.id))
      .where(and(...conditions))
      .orderBy(asc(products.name));
    
    return result.map(item => ({
      ...item,
      zone: item.zone || null,
    }));
  }

  async getProduct(id: number): Promise<ProductWithZone | undefined> {
    const [result] = await db
      .select({
        id: products.id,
        productId: products.productId,
        name: products.name,
        description: products.description,
        category: products.category,
        zoneId: products.zoneId,
        currentStock: products.currentStock,
        minStock: products.minStock,
        unitPrice: products.unitPrice,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        zone: zones,
      })
      .from(products)
      .leftJoin(zones, eq(products.zoneId, zones.id))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      ...result,
      zone: result.zone || null,
    };
  }

  async getProductByProductId(productId: string): Promise<ProductWithZone | undefined> {
    const [result] = await db
      .select({
        id: products.id,
        productId: products.productId,
        name: products.name,
        description: products.description,
        category: products.category,
        zoneId: products.zoneId,
        currentStock: products.currentStock,
        minStock: products.minStock,
        unitPrice: products.unitPrice,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        zone: zones,
      })
      .from(products)
      .leftJoin(zones, eq(products.zoneId, zones.id))
      .where(eq(products.productId, productId));

    if (!result) return undefined;

    return {
      ...result,
      zone: result.zone || null,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const now = Date.now();
    const [newProduct] = await db.insert(products).values({
      ...product,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: Date.now() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
  }

  // Movement operations
  async getMovements(productId?: number, limit: number = 50): Promise<MovementWithProduct[]> {
    const conditions = [];

    if (productId) {
      conditions.push(eq(movements.productId, productId));
    }

    const result = await db
      .select({
        id: movements.id,
        productId: movements.productId,
        type: movements.type,
        quantity: movements.quantity,
        previousStock: movements.previousStock,
        newStock: movements.newStock,
        reason: movements.reason,
        userId: movements.userId,
        createdAt: movements.createdAt,
        product: products,
        user: users,
      })
      .from(movements)
      .leftJoin(products, eq(movements.productId, products.id))
      .leftJoin(users, eq(movements.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(movements.createdAt))
      .limit(limit);
    
    return result.map(item => ({
      ...item,
      product: item.product!,
      user: item.user || null,
    }));
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    const [newMovement] = await db.insert(movements).values({
      ...movement,
      createdAt: Date.now(),
    }).returning();
    return newMovement;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    recentActivities: MovementWithProduct[];
    zoneStatus: Array<Zone & { itemCount: number; capacity: number }>;
  }> {
    const [totalItems] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(eq(products.isActive, 1));

    const [lowStockItems] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, 1),
          sql`${products.currentStock} <= ${products.minStock}`,
          sql`${products.currentStock} > 0`
        )
      );

    const [outOfStockItems] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, 1),
          eq(products.currentStock, 0)
        )
      );

    const [totalValue] = await db
      .select({ 
        total: sql<number>`cast(coalesce(sum(${products.currentStock} * ${products.unitPrice}), 0) as integer)` 
      })
      .from(products)
      .where(eq(products.isActive, 1));

    const recentActivities = await this.getMovements(undefined, 10);

    const zoneStatusResult = await db
      .select({
        id: zones.id,
        name: zones.name,
        description: zones.description,
        capacity: zones.capacity,
        createdAt: zones.createdAt,
        updatedAt: zones.updatedAt,
        itemCount: sql<number>`cast(coalesce(count(${products.id}), 0) as integer)`,
      })
      .from(zones)
      .leftJoin(products, and(eq(zones.id, products.zoneId), eq(products.isActive, 1)))
      .groupBy(zones.id)
      .orderBy(asc(zones.name));

    const zoneStatus = zoneStatusResult.map(zone => ({
      ...zone,
      capacity: zone.capacity || 0,
    }));

    return {
      totalItems: totalItems.count,
      lowStockItems: lowStockItems.count,
      outOfStockItems: outOfStockItems.count,
      totalValue: totalValue.total,
      recentActivities,
      zoneStatus,
    };
  }

  // Stock operations
  async updateStock(productId: number, quantity: number, type: "IN" | "OUT", reason?: string, userId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current product
      const [product] = await tx.select().from(products).where(eq(products.id, productId));
      if (!product) throw new Error("Product not found");

      const previousStock = product.currentStock || 0;
      const newStock = type === "IN" ? previousStock + quantity : previousStock - quantity;

      if (newStock < 0) {
        throw new Error("Insufficient stock");
      }

      // Update product stock
      await tx
        .update(products)
        .set({ currentStock: newStock, updatedAt: Date.now() })
        .where(eq(products.id, productId));

      // Create movement log
      await tx.insert(movements).values({
        productId,
        type,
        quantity,
        previousStock,
        newStock,
        reason: reason || null,
        userId: userId || null,
        createdAt: Date.now(),
      });
    });
  }
}

export const storage = new DatabaseStorage();

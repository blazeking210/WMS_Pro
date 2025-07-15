import {
  users,
  zones,
  products,
  movements,
  type User,
  type UpsertUser,
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
import { eq, desc, asc, sql, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    const [newZone] = await db.insert(zones).values(zone).returning();
    return newZone;
  }

  async updateZone(id: number, zone: Partial<InsertZone>): Promise<Zone> {
    const [updatedZone] = await db
      .update(zones)
      .set({ ...zone, updatedAt: new Date() })
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
          ilike(products.name, `%${filters.search}%`),
          ilike(products.productId, `%${filters.search}%`),
          ilike(products.category, `%${filters.search}%`)
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
            sql`${products.currentStock} <= ${products.minStock} AND ${products.currentStock} > 0`
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
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
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
    const [newMovement] = await db.insert(movements).values(movement).returning();
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
      .where(eq(products.isActive, true));

    const [lowStockItems] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.currentStock} <= ${products.minStock}`,
          sql`${products.currentStock} > 0`
        )
      );

    const [outOfStockItems] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.currentStock, 0)
        )
      );

    const [totalValue] = await db
      .select({ 
        total: sql<number>`cast(coalesce(sum(${products.currentStock} * ${products.unitPrice}), 0) as integer)` 
      })
      .from(products)
      .where(eq(products.isActive, true));

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
      .leftJoin(products, and(eq(zones.id, products.zoneId), eq(products.isActive, true)))
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
        .set({ currentStock: newStock, updatedAt: new Date() })
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
      });
    });
  }
}

export const storage = new DatabaseStorage();

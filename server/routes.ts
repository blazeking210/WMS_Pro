import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertZoneSchema, insertProductSchema, insertMovementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Zone routes
  app.get('/api/zones', isAuthenticated, async (req, res) => {
    try {
      const zones = await storage.getZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching zones:", error);
      res.status(500).json({ message: "Failed to fetch zones" });
    }
  });

  app.get('/api/zones/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const zone = await storage.getZone(id);
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      res.json(zone);
    } catch (error) {
      console.error("Error fetching zone:", error);
      res.status(500).json({ message: "Failed to fetch zone" });
    }
  });

  app.post('/api/zones', isAuthenticated, async (req, res) => {
    try {
      const zoneData = insertZoneSchema.parse(req.body);
      const zone = await storage.createZone(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      console.error("Error creating zone:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid zone data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create zone" });
    }
  });

  app.put('/api/zones/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const zoneData = insertZoneSchema.partial().parse(req.body);
      const zone = await storage.updateZone(id, zoneData);
      res.json(zone);
    } catch (error) {
      console.error("Error updating zone:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid zone data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update zone" });
    }
  });

  app.delete('/api/zones/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteZone(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting zone:", error);
      res.status(500).json({ message: "Failed to delete zone" });
    }
  });

  // Product routes
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        zoneId: req.query.zoneId ? parseInt(req.query.zoneId as string) : undefined,
        status: req.query.status as "all" | "in_stock" | "low_stock" | "out_of_stock" | undefined,
        search: req.query.search as string,
      };

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Create initial stock movement if there's initial stock
      if (productData.currentStock && productData.currentStock > 0) {
        await storage.createMovement({
          productId: product.id,
          type: "IN",
          quantity: productData.currentStock,
          previousStock: 0,
          newStock: productData.currentStock,
          reason: "Initial stock",
          userId: req.user.claims.sub,
        });
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Stock update route
  app.post('/api/products/:id/stock', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity, type, reason } = req.body;

      if (!quantity || !type || !["IN", "OUT"].includes(type)) {
        return res.status(400).json({ message: "Invalid stock update data" });
      }

      await storage.updateStock(id, quantity, type, reason, req.user.claims.sub);
      res.json({ message: "Stock updated successfully" });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update stock" });
    }
  });

  // Movement routes
  app.get('/api/movements', isAuthenticated, async (req, res) => {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const movements = await storage.getMovements(productId, limit);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching movements:", error);
      res.status(500).json({ message: "Failed to fetch movements" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
